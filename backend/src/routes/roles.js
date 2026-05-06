import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const roles = db
    .prepare('SELECT * FROM roles WHERE tenant_id = ? ORDER BY created_at')
    .all(req.user.tenant_id);

  res.json({
    success: true,
    message: 'OK',
    data: roles.map((r) => ({
      role_id: r.role_id,
      tenant_id: r.tenant_id,
      allowed_modules: r.allowed_modules,
      name: r.name,
      description: r.description,
      user_count: r.user_count,
      created_at: r.created_at,
    })),
  });
});

export default router;
