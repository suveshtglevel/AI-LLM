import { logger } from '../../config/logger';
import { EmployeeRegistry, IEmployeeRegistration } from '../../registries/employee.registry';

export interface DepartmentInfo {
  id: string;
  name: string;
  description: string;
  employeeCount: number;
  employees: IEmployeeRegistration[];
  /** All unique skills across employees in this department */
  skills: string[];
}

class DepartmentRegistryClass {
  /**
   * List all departments discovered from employee registrations.
   */
  list(): DepartmentInfo[] {
    const employees = EmployeeRegistry.list();
    const grouped = new Map<string, IEmployeeRegistration[]>();

    for (const emp of employees) {
      const dept = emp.department || 'uncategorized';
      if (!grouped.has(dept)) {
        grouped.set(dept, []);
      }
      grouped.get(dept)!.push(emp);
    }

    const departments: DepartmentInfo[] = [];
    for (const [id, deptEmployees] of grouped) {
      const skills = new Set<string>();
      for (const emp of deptEmployees) {
        for (const skill of emp.skills) {
          skills.add(skill);
        }
      }

      departments.push({
        id,
        name: this.formatDepartmentName(id),
        description: this.getDescription(id),
        employeeCount: deptEmployees.length,
        employees: deptEmployees,
        skills: Array.from(skills).sort(),
      });
    }

    return departments.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Get a single department by ID.
   */
  get(id: string): DepartmentInfo | undefined {
    return this.list().find(d => d.id === id);
  }

  /**
   * Find which department an employee type belongs to.
   */
  getDepartmentForEmployee(employeeType: string): DepartmentInfo | undefined {
    const emp = EmployeeRegistry.get(employeeType);
    if (!emp) return undefined;
    return this.get(emp.department);
  }

  /**
   * Get all employees in a specific department.
   */
  getEmployees(departmentId: string): IEmployeeRegistration[] {
    const dept = this.get(departmentId);
    return dept?.employees || [];
  }

  /**
   * Count departments.
   */
  count(): number {
    return this.list().length;
  }

  private formatDepartmentName(id: string): string {
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  private getDescription(id: string): string {
    const descriptions: Record<string, string> = {
      research: 'Internet research, fact-checking, source verification, and data gathering',
      content: 'Writing, reviewing, SEO optimization, and content quality management',
      media: 'Voice narration, image generation, video production, and post-production editing',
      publishing: 'Multi-platform content publishing, social media distribution, and cross-posting',
      analytics: 'Performance tracking, data analysis, metrics reporting, and A/B testing',
      memory: 'Long-term memory storage, knowledge management, pattern learning, and project history',
      management: 'Project planning, task orchestration, resource allocation, and workflow management',
    };
    return descriptions[id] || `${this.formatDepartmentName(id)} department`;
  }
}

export const DepartmentRegistry = new DepartmentRegistryClass();
