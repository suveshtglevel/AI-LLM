import { logger } from '../config/logger';
import { ToolResult } from '../types';

export interface IToolRegistration {
  name: string;
  description: string;
  category: 'search' | 'content' | 'media' | 'social' | 'analysis' | 'utility';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createInstance: () => any;
}

class ToolRegistryClass {
  private tools = new Map<string, IToolRegistration>();

  register(tool: IToolRegistration): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`[ToolRegistry] Overwriting tool: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
    logger.debug(`[ToolRegistry] Registered: ${tool.name} (${tool.category})`);
  }

  get(name: string): IToolRegistration | undefined {
    return this.tools.get(name);
  }

  list(): IToolRegistration[] {
    return Array.from(this.tools.values());
  }

  getByCategory(category: string): IToolRegistration[] {
    return this.list().filter(t => t.category === category);
  }

  /**
   * Execute a tool method by tool name and method name.
   * Employees should NEVER call APIs directly — always through this.
   */
  async execute(toolName: string, method: string, ...args: any[]): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { success: false, error: `Tool "${toolName}" not found in registry` };
    }

    const instance = tool.createInstance();
    const fn = (instance as any)[method];
    if (typeof fn !== 'function') {
      return { success: false, error: `Method "${method}" not found on tool "${toolName}"` };
    }

    return fn.apply(instance, args);
  }

  count(): number {
    return this.tools.size;
  }
}

export const ToolRegistry = new ToolRegistryClass();
