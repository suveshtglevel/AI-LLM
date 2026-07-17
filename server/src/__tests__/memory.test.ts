import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock mongoose BEFORE importing the module under test to prevent real DB operations
const mockExec = jest.fn<any>();
const mockFindOne = jest.fn(() => ({ exec: mockExec }));
const mockFindOneAndUpdate = jest.fn(() => ({ exec: mockExec }));
const mockDeleteMany = jest.fn(() => ({ exec: mockExec }));
const mockSave = jest.fn<any>();

jest.mock('mongoose', () => ({
  connect: jest.fn(() => Promise.resolve()),
  disconnect: jest.fn(() => Promise.resolve()),
  Schema: class MockSchema {
    static Types: Record<string, string> = { Mixed: 'Mixed' };
    constructor(schema: any, options?: any) {}
    index() { return this; }
  },
  model: jest.fn(() => Object.assign(
    // Mongoose models are constructable — return a mock constructor
    jest.fn(() => ({ save: mockSave })),
    {
      findOne: mockFindOne,
      findOneAndUpdate: mockFindOneAndUpdate,
      deleteMany: mockDeleteMany,
    }
  )),
}));

// Now import the module under test — mongoose is already mocked
import { MemoryModel } from '../modules/memory/memory.model';

const mockMemoryData = {
  taskId: 'task-uuid',
  userId: 'user-uuid',
  conversationHistory: [],
  previousResearch: '',
  importantFacts: [],
  learnedPatterns: [],
  metadata: {},
  toJSON: jest.fn(() => ({})),
};

describe('MemoryModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExec.mockResolvedValue(mockMemoryData);
    mockSave.mockResolvedValue(mockMemoryData);
  });

  describe('createMemory', () => {
    it('should create a new memory document', async () => {
      const result = await MemoryModel.createMemory('task-uuid', 'user-uuid');
      expect(result).toBeDefined();
    });
  });

  describe('getMemory', () => {
    it('should return memory for a task', async () => {
      const result = await MemoryModel.getMemory('task-uuid', 'user-uuid');
      expect(result).toBeDefined();
      expect(result?.taskId).toBe('task-uuid');
    });

    it('should return null if no memory exists', async () => {
      mockExec.mockResolvedValue(null);
      const result = await MemoryModel.getMemory('task-uuid', 'user-uuid');
      expect(result).toBeNull();
    });
  });

  describe('addConversationEntry', () => {
    it('should add a conversation entry', async () => {
      const result = await MemoryModel.addConversationEntry('task-uuid', 'user-uuid', {
        role: 'user',
        content: 'Hello, agent!',
      });
      expect(result).toBeDefined();
    });
  });

  describe('addImportantFact', () => {
    it('should add an important fact', async () => {
      const result = await MemoryModel.addImportantFact('task-uuid', 'user-uuid', {
        fact: 'AI is transforming healthcare',
        source: 'https://example.com',
        confidence: 85,
      });
      expect(result).toBeDefined();
    });
  });

  describe('deleteMemory', () => {
    it('should delete all memories for a task', async () => {
      mockExec.mockResolvedValue({ deletedCount: 1 });
      await MemoryModel.deleteMemory('task-uuid');
    });
  });
});
