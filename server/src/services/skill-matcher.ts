import { logger } from '../config/logger';
import { EmployeeRegistry, IEmployeeRegistration } from '../registries/employee.registry';
import { DepartmentRegistry } from '../features/departments/department.registry';
import { ActivityLog } from '../features/employees/employee.model';

export interface SkillMatchResult {
  employeeType: string;
  employeeName: string;
  department: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface TaskSkillRequirement {
  /** The preferred employee type (e.g., 'writer') */
  preferredType?: string;
  /** Required skills for the task */
  requiredSkills: string[];
  /** Optional department filter */
  department?: string;
}

class SkillMatcherClass {
  /**
   * Find the best employee match for a given task skill requirement.
   *
   * Strategy:
   * 1. If preferredType is specified and has the required skills → use it
   * 2. Search within the same department for employees with matching skills
   * 3. Search across all employees for the best skill match
   */
  async findBestMatch(requirement: TaskSkillRequirement): Promise<SkillMatchResult> {
    const startTime = Date.now();

    // Strategy 1: Check if preferred type matches
    if (requirement.preferredType) {
      const preferred = EmployeeRegistry.get(requirement.preferredType);
      if (preferred) {
        const matchResult = this.scoreMatch(preferred, requirement.requiredSkills);
        if (matchResult.matchScore >= 0.5) {
          logger.debug(`[SkillMatcher] Preferred match: ${requirement.preferredType} (score: ${matchResult.matchScore})`);
          return matchResult;
        }
      }
    }

    // Strategy 2: Search within department
    if (requirement.department) {
      const deptEmployees = DepartmentRegistry.getEmployees(requirement.department);
      const deptMatches = deptEmployees
        .map(emp => this.scoreMatch(emp, requirement.requiredSkills))
        .filter(m => m.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

      if (deptMatches.length > 0) {
        logger.debug(`[SkillMatcher] Department match in ${requirement.department}: ${deptMatches[0].employeeType}`);
        return deptMatches[0];
      }
    }

    // Strategy 3: Search all employees
    const allEmployees = EmployeeRegistry.list();
    const allMatches = allEmployees
      .map(emp => this.scoreMatch(emp, requirement.requiredSkills))
      .filter(m => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    if (allMatches.length > 0) {
      logger.debug(`[SkillMatcher] Cross-department match: ${allMatches[0].employeeType} (score: ${allMatches[0].matchScore})`);
      return allMatches[0];
    }

    // Fallback: Return preferred type if specified, otherwise first employee
    const fallback = requirement.preferredType
      ? EmployeeRegistry.get(requirement.preferredType)
      : allEmployees[0];

    if (fallback) {
      logger.warn(`[SkillMatcher] No skill matches found, falling back to: ${fallback.type}`);
      return {
        employeeType: fallback.type,
        employeeName: fallback.name,
        department: fallback.department,
        matchScore: 0,
        matchedSkills: [],
        missingSkills: requirement.requiredSkills,
      };
    }

    // Last resort — shouldn't happen
    logger.error('[SkillMatcher] No employees registered at all');
    return {
      employeeType: 'research',
      employeeName: 'Research Employee',
      department: 'research',
      matchScore: 0,
      matchedSkills: [],
      missingSkills: requirement.requiredSkills,
    };
  }

  /**
   * Score how well an employee matches required skills.
   * Returns a score from 0 to 1 (1 = perfect match).
   */
  private scoreMatch(employee: IEmployeeRegistration, requiredSkills: string[]): SkillMatchResult {
    const empSkills = employee.skills.map(s => s.toLowerCase());
    const reqSkills = requiredSkills.map(s => s.toLowerCase());

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const req of reqSkills) {
      const exactMatch = empSkills.includes(req);
      const partialMatch = empSkills.some(es => es.includes(req) || req.includes(es));

      if (exactMatch || partialMatch) {
        matchedSkills.push(requiredSkills[reqSkills.indexOf(req)]);
      } else {
        missingSkills.push(requiredSkills[reqSkills.indexOf(req)]);
      }
    }

    const totalSkills = requiredSkills.length;
    const matchScore = totalSkills > 0 ? matchedSkills.length / totalSkills : 0;

    return {
      employeeType: employee.type,
      employeeName: employee.name,
      department: employee.department,
      matchScore,
      matchedSkills,
      missingSkills,
    };
  }

  /**
   * Automatically assign a task to the best employee based on skill requirements.
   * This is the main API used by the Manager.
   */
  async assignTask(
    projectId: string,
    userId: string,
    skillRequirements: TaskSkillRequirement
  ): Promise<{ employeeType: string; match: SkillMatchResult }> {
    const match = await this.findBestMatch(skillRequirements);

    await ActivityLog.create({
      userId,
      projectId,
      employeeType: match.employeeType,
      action: 'skill_assigned',
      status: 'completed',
      duration: 0,
      metadata: {
        requiredSkills: skillRequirements.requiredSkills,
        matchScore: match.matchScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        preferredType: skillRequirements.preferredType,
      },
    });

    return { employeeType: match.employeeType, match };
  }
}

export const SkillMatcher = new SkillMatcherClass();
