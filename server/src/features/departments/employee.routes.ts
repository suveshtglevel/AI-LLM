import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { EmployeeRegistry } from '../../registries/employee.registry';
import { DepartmentRegistry } from './department.registry';

const router = Router();
router.use(authenticate);

/**
 * GET /api/employees
 * List all registered employees with skills, departments, and tools
 */
router.get('/', async (req, res, next) => {
  try {
    const { department, skill } = req.query as { department?: string; skill?: string };

    let employees = EmployeeRegistry.list();

    // Filter by department
    if (department) {
      employees = employees.filter(e => e.department === department);
    }

    // Filter by skill
    if (skill) {
      const skillLower = skill.toLowerCase();
      employees = employees.filter(e => e.skills.some(s => s.toLowerCase().includes(skillLower)));
    }

    res.json({
      success: true,
      data: {
        employees: employees.map(e => ({
          type: e.type,
          name: e.name,
          department: e.department,
          role: e.role,
          description: e.description,
          skills: e.skills,
          allowedTools: e.allowedTools,
        })),
        total: employees.length,
      },
    });
  } catch (error) { next(error); }
});

/**
 * GET /api/employees/:type
 * Get a specific employee by type
 */
router.get('/:type', async (req, res, next) => {
  try {
    const employee = EmployeeRegistry.get(req.params.type);
    if (!employee) {
      res.status(404).json({ success: false, error: { message: `Employee type "${req.params.type}" not found` } });
      return;
    }

    // Get department info
    const department = DepartmentRegistry.get(employee.department);

    res.json({
      success: true,
      data: {
        type: employee.type,
        name: employee.name,
        department: employee.department,
        departmentName: department?.name || employee.department,
        role: employee.role,
        description: employee.description,
        skills: employee.skills,
        allowedTools: employee.allowedTools,
        departmentEmployees: department?.employees
          .filter(e => e.type !== employee.type)
          .map(e => ({ type: e.type, name: e.name })) || [],
      },
    });
  } catch (error) { next(error); }
});

export default router;
