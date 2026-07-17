import { logger } from '../config/logger';
import { BaseEmployee } from '../features/employees/base-employee.model';

export interface IEmployeeRegistration {
  type: string;
  name: string;
  department: string;
  role: string;
  description: string;
  skills: string[];
  allowedTools: string[];
  createInstance: () => BaseEmployee;
}

class EmployeeRegistryClass {
  private employees = new Map<string, IEmployeeRegistration>();

  register(registration: IEmployeeRegistration): void {
    if (this.employees.has(registration.type)) {
      logger.warn(`[EmployeeRegistry] Overwriting employee type: ${registration.type}`);
    }
    this.employees.set(registration.type, registration);
    logger.debug(`[EmployeeRegistry] Registered: ${registration.type} (${registration.name})`);
  }

  get(type: string): IEmployeeRegistration | undefined {
    return this.employees.get(type);
  }

  list(): IEmployeeRegistration[] {
    return Array.from(this.employees.values());
  }

  getByDepartment(department: string): IEmployeeRegistration[] {
    return this.list().filter(e => e.department === department);
  }

  findBySkill(skill: string): IEmployeeRegistration[] {
    const lower = skill.toLowerCase();
    return this.list().filter(e => e.skills.some(s => s.toLowerCase().includes(lower)));
  }

  count(): number {
    return this.employees.size;
  }
}

export const EmployeeRegistry = new EmployeeRegistryClass();
