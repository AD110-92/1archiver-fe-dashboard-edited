import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

router.get('/:tenantId', authenticate, (req, res) => {
  const tenant = db.prepare('SELECT * FROM tenants WHERE tenant_id = ?').get(req.params.tenantId);

  if (!tenant) {
    return res.status(404).json({ success: false, message: 'Tenant not found', data: null });
  }

  res.json({
    success: true,
    message: 'OK',
    data: {
      tenant_id: tenant.tenant_id,
      deployment_type: tenant.deployment_type,
      name: tenant.name,
      created_at: tenant.created_at,
    },
  });
});

export default router;
