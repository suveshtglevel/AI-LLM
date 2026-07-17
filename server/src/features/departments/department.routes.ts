import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { DepartmentRegistry } from './department.registry';

const router = Router();
router.use(authenticate);

/**
 * GET /api/departments
 * List all departments with employee counts and skills
 */
router.get('/', async (_req, res, next) => {
  try {
    const departments = DepartmentRegistry.list();
    res.json({
      success: true,
      data: {
        departments: departments.map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          employeeCount: d.employeeCount,
          skills: d.skills,
          employeeTypes: d.employees.map(e => e.type),
        })),
        total: departments.length,
      },
    });
  } catch (error) { next(error); }
});

/**
 * GET /api/departments/:id
 * Get department details with full employee info
 */
router.get('/:id', async (req, res, next) => {
  try {
    const department = DepartmentRegistry.get(req.params.id);
    if (!department) {
      res.status(404).json({ success: false, error: { message: 'Department not found' } });
      return;
    }

    res.json({
      success: true,
      data: {
        id: department.id,
        name: department.name,
        description: department.description,
        employeeCount: department.employeeCount,
        skills: department.skills,
        employees: department.employees.map(e => ({
          type: e.type,
          name: e.name,
          role: e.role,
          description: e.description,
          skills: e.skills,
          allowedTools: e.allowedTools,
        })),
      },
    });
  } catch (error) { next(error); }
});

/**
 * GET /api/departments/:id/employees
 * Get employees in a specific department
 */
router.get('/:id/employees', async (req, res, next) => {
  try {
    const employees = DepartmentRegistry.getEmployees(req.params.id);
    if (!employees.length && !DepartmentRegistry.get(req.params.id)) {
      res.status(404).json({ success: false, error: { message: 'Department not found' } });
      return;
    }

    res.json({
      success: true,
      data: {
        departmentId: req.params.id,
        employees: employees.map(e => ({
          type: e.type,
          name: e.name,
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

export default router;
