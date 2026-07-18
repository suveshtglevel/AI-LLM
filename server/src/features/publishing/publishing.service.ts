import { logger } from '../../config/logger';
import { PlatformConfig, PublishJob, IPublishJob, IPublishStatus } from './publishing.model';

// ─── Platform API implementations ────────────────────────────────────

interface PlatformClient {
  upload(job: IPublishJob, token: string): Promise<{ id: string; url: string }>;
  refresh?(refreshToken: string): Promise<string>;
}

const platformClients: Record<string, PlatformClient> = {};

// YouTube Data API v3
platformClients['youtube'] = {
  async upload(job: IPublishJob, token: string) {
    const url = `https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable`;
    const body = {
      snippet: {
        title: job.title,
        description: `${job.description}\n\n${job.content}`,
        tags: job.tags,
      },
      status: { privacyStatus: 'public' },
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'application/octet-stream',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YouTube API error: ${response.status} ${error}`);
    }
    const data: any = await response.json();
    const videoId = data.id;
    return {
      id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  },
};

// Instagram Graph API
platformClients['instagram'] = {
  async upload(job: IPublishJob, token: string) {
    const igId = process.env.INSTAGRAM_BUSINESS_ID || '';
    if (!igId) throw new Error('INSTAGRAM_BUSINESS_ID not set');
    // Create media container
    const createUrl = `https://graph.facebook.com/v18.0/${igId}/media`;
    const createBody = {
      media_type: job.contentType === 'video' ? 'VIDEO' : 'IMAGE',
      video_url: job.fileUrl || undefined,
      image_url: job.fileUrl || undefined,
      caption: `${job.title}\n\n${job.description}\n\n${job.tags.map(t => '#' + t.replace(/[^a-zA-Z0-9]/g, '')).join(' ')}`,
      access_token: token,
    };
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createBody),
    });
    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Instagram API error (create): ${createResponse.status} ${error}`);
    }
    const createData: any = await createResponse.json();
    const containerId = createData.id;
    // Publish the container
    await new Promise(r => setTimeout(r, 5000));
    const publishUrl = `https://graph.facebook.com/v18.0/${igId}/media_publish`;
    const publishBody = { creation_id: containerId, access_token: token };
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishBody),
    });
    if (!publishResponse.ok) {
      const error = await publishResponse.text();
      throw new Error(`Instagram API error (publish): ${publishResponse.status} ${error}`);
    }
    const publishData: any = await publishResponse.json();
    return {
      id: publishData.id,
      url: `https://www.instagram.com/p/${publishData.id}/`,
    };
  }
};

platformClients['tiktok'] = {
  async upload(job: IPublishJob, token: string) {
    throw new Error('TikTok direct upload not yet implemented. Use the social employee for draft generation.');
  },
};

platformClients['x'] = {
  async upload(job: IPublishJob, token: string) {
    throw new Error('X (Twitter) direct upload not yet implemented. Use the social employee for draft generation.');
  },
};

platformClients['linkedin'] = {
  async upload(job: IPublishJob, token: string) {
    throw new Error('LinkedIn direct upload not yet implemented. Use the social employee for draft generation.');
  },
};

// ─── Publishing Service ─────────────────────────────────────────────

class PublishingService {
  /**
   * Publish a job to all its pending platforms.
   */
  async publishJob(jobId: string): Promise<IPublishJob> {
    const job = await PublishJob.findById(jobId);
    if (!job) throw new Error(`PublishJob ${jobId} not found`);
    const config = await PlatformConfig.findOne({ userId: job.userId });
    if (!config) throw new Error(`Platform config not found for user ${job.userId}`);

    let allSucceeded = true;

    for (const ps of job.platforms) {
      if (ps.status !== 'pending') continue;
      const credential = config.platforms.find(p => p.platform === ps.platform && p.isActive);
      if (!credential) {
        ps.status = 'failed';
        ps.errorMessage = `No active credentials for ${ps.platform}`;
        allSucceeded = false;
        continue;
      }

      const client = platformClients[ps.platform];
      if (!client) {
        ps.status = 'failed';
        ps.errorMessage = `No client implementation for ${ps.platform}`;
        allSucceeded = false;
        continue;
      }

      ps.status = 'publishing';
      await job.save();

      try {
        const result = await client.upload(job, credential.accessToken);
        ps.status = 'published';
        ps.externalId = result.id;
        ps.externalUrl = result.url;
        ps.publishedAt = new Date();
        logger.info(`[Publishing] Published to ${ps.platform}: ${result.url}`);
      } catch (error: any) {
        ps.status = 'failed';
        ps.errorMessage = error.message;
        ps.retryCount = (ps.retryCount || 0) + 1;
        ps.lastRetry = new Date();
        credential.failureCount++;
        if (credential.failureCount >= 5) {
          credential.isActive = false;
          await config.save();
        }
        allSucceeded = false;
        logger.error(`[Publishing] Failed to publish to ${ps.platform}: ${error.message}`);
      }
    }

    // Determine overall job status
    const pending = job.platforms.some(p => p.status === 'pending');
    const published = job.platforms.some(p => p.status === 'published');
    if (pending) {
      job.status = 'queued';
    } else if (allSucceeded) {
      job.status = 'completed';
    } else if (published) {
      job.status = 'partially_completed';
    } else {
      job.status = 'failed';
    }

    await job.save();
    await config.save();

    return job;
  }

  /**
   * Publish all pending jobs for a project.
   */
  async publishProject(projectId: string): Promise<IPublishJob[]> {
    const jobs = await PublishJob.find({ projectId, status: 'queued' });
    const results: IPublishJob[] = [];
    for (const job of jobs) {
      results.push(await this.publishJob(job._id.toString()));
    }
    return results;
  }

  /**
   * Refresh tokens that are about to expire.
   */
  async refreshTokens(userId: string): Promise<void> {
    const config = await PlatformConfig.findOne({ userId });
    if (!config) return;

    const now = Date.now();
    for (const credential of config.platforms) {
      if (!credential.isActive) continue;
      const expiresIn = credential.expiresAt ? credential.expiresAt.getTime() - now : Infinity;
      if (expiresIn > 0 && expiresIn < 86400000) {
        // Expires in less than 24h, try to refresh
        const client = platformClients[credential.platform];
        if (client?.refresh && credential.refreshToken) {
          try {
            const result = await client.refresh(credential.refreshToken);
            credential.accessToken = result;
            credential.expiresAt = new Date(Date.now() + 3600000);
            logger.info(`[Publishing] Refreshed token for ${credential.accountName} (${credential.platform})`);
          } catch (error) {
            logger.error(`[Publishing] Failed to refresh token for ${credential.platform}: ${error}`);
          }
        }
      }
    }

    await config.save();
  }
}

export const publishingService = new PublishingService();
