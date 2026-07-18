# AI Provider Setup Guide

## Quick Start

Add your API keys in `server/.env`. See example below for each provider.

---

## Provider Details

### 1. OpenAI — `OPENAI_API_KEY`
- **Free tier:** 100k tokens/day, resets every 60 min
- **Get key:** https://platform.openai.com/api-keys
- **Models:** gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
```

---

### 2. Gemini (Google) — `GEMINI_API_KEY`
- **Free tier:** Available via Google AI Studio
- **Get key:** https://aistudio.google.com/apikey
- **Models:** gemini-pro, gemini-1.5-pro, gemini-1.5-flash

```env
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxx
```

---

### 3. Groq — `GROQ_API_KEY`
- **Free tier:** Available (rate-limited)
- **Get key:** https://console.groq.com/keys
- **Models:** mixtral-8x7b-32768, llama2-70b-4096, gemma2-9b-it

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxx
```

---

### 4. OpenRouter — `OPENROUTER_API_KEY`
- **Free tier:** Aggregates many models with free limits
- **Get key:** https://openrouter.ai/keys
- **Models:** openai/gpt-4o-mini, anthropic/claude-3.5-sonnet, google/gemini-pro

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
```

---

### 5. Mistral AI — `MISTRAL_API_KEY`
- **Free tier:** Limited (1k tokens/day) — good for prototyping
- **Get key:** https://console.mistral.ai/api-keys
- **Models:** mistral-small-latest, mistral-medium-latest, mistral-large-latest

```env
MISTRAL_API_KEY=mist-xxxxxxxxxxxx
```

---

### 6. GitHub Models — `GITHUB_MODELS_API_KEY`
- **Free tier:** Free with GitHub account
- **Get key:** https://github.com/settings/tokens (generate a classic PAT)
- **Models:** gpt-4o-mini, gpt-4o, gpt-4-turbo

```env
GITHUB_MODELS_API_KEY=ghp_xxxxxxxxxxxx
```

---

### 7. DeepSeek — `DEEPSEEK_API_KEY`
- **Free tier:** 100k tokens/day, resets every 60 min
- **Get key:** https://platform.deepseek.com/api_keys
- **Models:** deepseek-chat, deepseek-coder

```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx
```

---

### 8. Hugging Face — `HUGGINGFACE_API_KEY`
- **Free tier:** 100k tokens/day, resets every 60 min
- **Get key:** https://huggingface.co/settings/tokens
- **Models:** mistralai/Mistral-7B-Instruct-v0.3, meta-llama/Llama-2-70b-chat-hf

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxx
```

---

### 9. Google Cloud AI Platform — `GOOGLECLOUD_API_KEY`
- **Free tier:** $300 free credit, expires after 90 days (~50k-100k tokens)
- **Get key:** https://console.cloud.google.com/apis/credentials (enable Vertex AI API)
- **Models:** gemini-1.5-pro, gemini-1.5-flash

```env
GOOGLECLOUD_API_KEY=AIzaSyxxxxxxxxxxxx
```

---

### 10. Microsoft Azure — `AZURE_API_KEY`
- **Free tier:** $200 credit, expires after 30 days (~20k-40k tokens)
- **Get key:** https://portal.azure.com → Create OpenAI resource → Keys and Endpoint
- **Models:** gpt-4o-mini, gpt-4o, gpt-4-turbo

```env
AZURE_API_KEY=xxxxxxxxxxxx
```

---

### 11. Anthropic Claude — `ANTHROPIC_API_KEY`
- **Free tier:** 10k tokens/month, may throttle heavy usage
- **Get key:** https://console.anthropic.com/account/keys
- **Models:** claude-3-haiku-20240307, claude-3-sonnet-20240229, claude-3-opus-20240229

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

---

### 12. LangChain (LLaMA) — `LANGCHAIN_API_KEY`
- **Free tier:** 20k tokens/day, resets every 4 hours
- **Get key:** https://smith.langchain.com/settings (or use provider's API)
- **Models:** llama-2-70b-chat, llama-2-13b-chat

```env
LANGCHAIN_API_KEY=lc-xxxxxxxxxxxx
```

---

### 13. AI21 Labs (Jurassic) — `AI21_API_KEY`
- **Free tier:** 50k tokens/month, hourly limit of 5k tokens
- **Get key:** https://www.ai21.com/account/api-key
- **Models:** j2-mid, j2-ultra

```env
AI21_API_KEY=j21-xxxxxxxxxxxx
```

---

### 14. Perplexity AI — `PERPLEXITY_API_KEY`
- **Free tier:** Unlimited personal use (throttles based on usage)
- **Get key:** https://www.perplexity.ai/settings/api
- **Models:** sonar-pro, sonar-small-chat

```env
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx
```

---

## Multi-Key Rotation (3-4 Accounts per Provider)

Each provider config in the database supports multiple API keys. The backend rotates between them automatically.

### Via Web UI
1. Go to **AI Providers** page
2. Click **Add Provider**
3. Select provider type
4. In **API Keys** field, paste all keys — one per line:
   ```
   sk-first-account-key...
   sk-second-account-key...
   sk-third-account-key...
   sk-fourth-account-key...
   ```
5. Click **Create Provider**

### Via API
```json
POST /api/providers/configs
{
  "name": "openai",
  "displayName": "OpenAI",
  "providerType": "openai",
  "apiKeys": [
    { "key": "sk-first-key..." },
    { "key": "sk-second-key..." },
    { "key": "sk-third-key..." }
  ],
  "baseUrl": "https://api.openai.com/v1",
  "models": ["gpt-4o", "gpt-4o-mini"],
  "defaultModel": "gpt-4o-mini"
}
```

### How Rotation Works
- Picks the **least-recently-used** active key
- Tracks **failure count** per key
- Deactivates a key after **3 consecutive failures**
- Uses **round-robin** across all active keys

---

## Set the Default Provider

In `server/.env`:

```env
AI_PROVIDER=openai
```

Valid values: `openai`, `gemini`, `groq`, `openrouter`, `mistral`, `github`, `deepseek`, `huggingface`, `googlecloud`, `azure`, `anthropic`, `langchain`, `ai21`, `perplexity`

---

## 📱 Social Media Publishing (YouTube & Instagram)

The system supports automatic upload to YouTube and Instagram when configured.

### 1. Get Your Platform Access Tokens

#### YouTube
1. Go to https://console.cloud.google.com
2. Create a project or select existing → Enable **YouTube Data API v3**
3. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. Set application type to **Web application**
5. Add redirect URI: `http://localhost:3000/api/publishing/auth/youtube/callback`
6. Copy the **Client ID** and **Client Secret**
7. Visit the following URL in your browser to get your refresh token:
   `https://accounts.google.com/o/oauth2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/api/publishing/auth/youtube/callback&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload&access_type=offline`
8. After authorization, you will get a code in the callback URL; exchange it for tokens using:
   ```bash
   curl -X POST https://oauth2.googleapis.com/token \
     -d "code=YOUR_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=http://localhost:3000/api/publishing/auth/youtube/callback" \
     -d "grant_type=authorization_code"
   ```
9. Save the `access_token` and `refresh_token`.

#### Instagram (Business Account)
1. You need a Facebook Page and Instagram Business Account connected
2. Go to https://developers.facebook.com/ and create an app
3. Add **Instagram Graph API** to your app
4. Generate a **User Access Token** with `instagram_basic, instagram_content_publish, pages_read_engagement, pages_show_list` scopes
5. Get your Instagram Business Account ID
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_TOKEN"
   ```
   Then find your Instagram Business ID:
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/YOUR_PAGE_ID?fields=instagram_business_account&access_token=YOUR_TOKEN"
   ```
6. Set the `INSTAGRAM_BUSINESS_ID` environment variable in `server/.env`:
   ```
   INSTAGRAM_BUSINESS_ID=12345678901234567
   ```

### 2. Add Platform Credentials to the System

Via API:

```bash
# Add YouTube
curl -X PUT http://localhost:3000/api/publishing/config/platforms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "accountName": "My YouTube Channel",
    "accessToken": "ya29.a0...",
    "refreshToken": "1//0g...",
    "scopes": ["https://www.googleapis.com/auth/youtube.upload"]
  }'

# Add Instagram
curl -X PUT http://localhost:3000/api/publishing/config/platforms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "accountName": "My Instagram",
    "accessToken": "EAAk...",
    "scopes": ["instagram_basic","instagram_content_publish"]
  }'
```

### 3. Create a Publish Job (Manual)

```bash
# Create a publishing job for a video
curl -X POST http://localhost:3000/api/publishing/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "507f1f77bcf86cd799439011",
    "title": "My Awesome Video",
    "description": "Check out this amazing video!",
    "content": "Full video description with links...",
    "contentType": "video",
    "fileUrl": "https://example.com/video.mp4",
    "tags": ["AI", "Machine Learning", "Tutorial"],
    "platforms": ["youtube"]
  }'

# Trigger the publish
curl -X POST http://localhost:3000/api/publishing/jobs/JOB_ID/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Check Publish Status

```bash
# List all jobs
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/publishing/jobs

# Get specific job
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/publishing/jobs/JOB_ID
```

### 5. All Publishing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/publishing/config` | Get platform config (tokens masked) |
| `PUT` | `/api/publishing/config` | Update platform config |
| `PUT` | `/api/publishing/config/platforms` | Add/update platform credentials |
| `DELETE` | `/api/publishing/config/platforms/:plt` | Remove platform credentials |
| `POST` | `/api/publishing/jobs` | Create a publish job |
| `GET` | `/api/publishing/jobs` | List publish jobs (filterable by `status`, `projectId`) |
| `GET` | `/api/publishing/jobs/:id` | Get single job detail |
| `POST` | `/api/publishing/jobs/:id/publish` | Trigger publishing for a job |
| `POST` | `/api/publishing/projects/:projectId/publish` | Publish all jobs for a project |

### How Auto-Publishing Works in Workflows

1. The **Publisher Employee** (`publisher` step in workflows) runs automatically after the `qa` step
2. It generates platform-optimized content (titles, descriptions, hashtags)
3. Creates a `PublishJob` in the publish queue
4. Sets the job status to `ready_for_publishing` or `publishing` (depending on auto-publish setting)
5. A human can then:
   - Approve the publisher task (since the workflow requires approval)
   - Review the generated content in the publish job
   - Trigger actual upload via `POST /api/publishing/jobs/:id/publish`
6. Or if `autoPublishEnabled` is turned on and `approvalRequired` is off, uploads happen automatically

### Enable Auto Publish

Via API:
```bash
curl -X PUT http://localhost:3000/api/publishing/config \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoPublishEnabled": true,
    "approvalRequired": false
  }'
```

---

## Full .env Template

```env
# Default provider
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini

# API Keys (single key per env var)
OPENAI_API_KEY=sk-placeholder
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
MISTRAL_API_KEY=
GITHUB_MODELS_API_KEY=
DEEPSEEK_API_KEY=
HUGGINGFACE_API_KEY=
GOOGLECLOUD_API_KEY=
AZURE_API_KEY=
ANTHROPIC_API_KEY=
LANGCHAIN_API_KEY=
AI21_API_KEY=
PERPLEXITY_API_KEY=

# Platform credentials (get via OAuth)
INSTAGRAM_BUSINESS_ID=
```
