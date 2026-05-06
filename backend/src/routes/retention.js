import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const policies = db
    .prepare('SELECT * FROM retention_policies WHERE tenant_id = ? ORDER BY created_at DESC')
    .all(req.user.tenant_id);

  res.json({
    success: true,
    message: 'OK',
    data: policies.map((p) => ({
      retention_policy_id: p.retention_policy_id,
      tenant_id: p.tenant_id,
      retention_days: p.retention_days,
      policy_name: p.policy_name,
      description: p.description,
      legal_basis: p.legal_basis,
      status: p.status,
      created_at: p.created_at,
    })),
  });
});

export default router;
