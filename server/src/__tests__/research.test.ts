import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ResearchModel } from '../modules/research/research.model';

// Mock Mongoose ResearchTask model
const mockCreate = jest.fn<any>();
const mockFind = jest.fn<any>();
const mockFindById = jest.fn<any>();
const mockFindByIdAndUpdate = jest.fn<any>();
const mockFindByIdAndDelete = jest.fn<any>();
const mockCountDocuments = jest.fn<any>();
const mockSort = jest.fn<any>();
const mockSkip = jest.fn<any>();
const mockLimit = jest.fn<any>();
const mockExec = jest.fn<any>();      // for find().exec()
const mockCountExec = jest.fn<any>(); // for countDocuments().exec()

// Chain: find().sort().skip().limit().exec()
mockFind.mockReturnValue({ sort: mockSort });
mockSort.mockReturnValue({ skip: mockSkip });
mockSkip.mockReturnValue({ limit: mockLimit });
mockLimit.mockReturnValue({ exec: mockExec });

// countDocuments() returns a Query with its own .exec()
mockCountDocuments.mockReturnValue({ exec: mockCountExec });

jest.mock('../modules/research/research-task.model', () => ({
  ResearchTask: Object.assign(
    jest.fn(),
    {
      create: (...args: any[]) => mockCreate(...args),
      find: (...args: any[]) => mockFind(...args),
      findById: (...args: any[]) => mockFindById(...args),
      findByIdAndUpdate: (...args: any[]) => mockFindByIdAndUpdate(...args),
      findByIdAndDelete: (...args: any[]) => mockFindByIdAndDelete(...args),
      countDocuments: (...args: any[]) => mockCountDocuments(...args),
    }
  ),
}));

jest.mock('../queues/research.queue', () => ({
  researchQueue: {
    add: jest.fn(() => Promise.resolve()),
  },
}));

const mockTask = {
  _id: 'task-uuid',
  id: 'task-uuid',
  userId: 'user-uuid',
  topic: 'AI in Healthcare',
  description: 'Research the impact of AI in healthcare',
  status: 'PENDING',
  priority: 'MEDIUM',
  error: null,
  createdAt: new Date('2024-01-01'),
  completedAt: null,
  toISOString: function () { return this.createdAt.toISOString(); },
};

describe('ResearchModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue(mockTask);
    mockFindById.mockResolvedValue(mockTask);
    mockFindByIdAndUpdate.mockResolvedValue(mockTask);
    mockFindByIdAndDelete.mockResolvedValue(mockTask);
    mockExec.mockResolvedValue([mockTask]);
    mockCountExec.mockResolvedValue(1);
  });

  describe('createTask', () => {
    it('should create a research task and add to queue', async () => {
      const result = await ResearchModel.createTask('user-uuid', {
        topic: 'AI in Healthcare',
        description: 'Research the impact of AI in healthcare',
      });

      expect(result).toBeDefined();
      expect(result.topic).toBe('AI in Healthcare');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('getTasks', () => {
    it('should return paginated tasks', async () => {
      const result = await ResearchModel.getTasks('user-uuid', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter tasks by status', async () => {
      const result = await ResearchModel.getTasks('user-uuid', {
        page: 1,
        limit: 20,
        status: 'PENDING' as any,
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getTask', () => {
    it('should return a task by ID', async () => {
      const result = await ResearchModel.getTask('task-uuid', 'user-uuid');

      expect(result).toBeDefined();
      expect(result.id).toBe('task-uuid');
    });

    it('should throw error if task not found', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(
        ResearchModel.getTask('nonexistent', 'user-uuid')
      ).rejects.toThrow('Task not found');
    });

    it('should throw error if unauthorized', async () => {
      mockFindById.mockResolvedValue({ ...mockTask, userId: 'other-user' });

      await expect(
        ResearchModel.getTask('task-uuid', 'user-uuid')
      ).rejects.toThrow('Unauthorized access to task');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task by ID', async () => {
      await expect(
        ResearchModel.deleteTask('task-uuid', 'user-uuid')
      ).resolves.not.toThrow();
    });

    it('should throw error if unauthorized', async () => {
      mockFindById.mockResolvedValue({ ...mockTask, userId: 'other-user' });

      await expect(
        ResearchModel.deleteTask('task-uuid', 'user-uuid')
      ).rejects.toThrow('Unauthorized access to task');
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status to COMPLETED', async () => {
      await expect(
        ResearchModel.updateTaskStatus('task-uuid', 'COMPLETED')
      ).resolves.not.toThrow();
    });

    it('should update task status with error', async () => {
      await expect(
        ResearchModel.updateTaskStatus('task-uuid', 'FAILED', 'Something went wrong')
      ).resolves.not.toThrow();
    });
  });
});
