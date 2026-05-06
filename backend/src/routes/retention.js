import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
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

router.post('/', authenticate, (req, res) => {
  const { policy_name, description, retention_days = 365, legal_basis = 'regulatory' } = req.body;

  if (!policy_name) {
    return res.json({ success: false, message: 'policy_name is required', data: null });
  }

  const policyId = uuidv4();
  db.prepare(
    `INSERT INTO retention_policies (retention_policy_id, tenant_id, retention_days, policy_name, description, legal_basis)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(policyId, req.user.tenant_id, retention_days, policy_name, description || null, legal_basis);

  db.prepare(
    `INSERT INTO audit_logs (audit_log_id, tenant_id, actor_user_id, action, target_type, target_id, outcome)
     VALUES (?, ?, ?, 'retention_policy.created', 'retention_policy', ?, 'Success')`
  ).run(uuidv4(), req.user.tenant_id, req.user.user_id, policyId);

  const policy = db.prepare('SELECT * FROM retention_policies WHERE retention_policy_id = ?').get(policyId);

  res.json({
    success: true,
    message: 'Retention policy created',
    data: {
      retention_policy_id: policy.retention_policy_id,
      tenant_id: policy.tenant_id,
      retention_days: policy.retention_days,
      policy_name: policy.policy_name,
      description: policy.description,
      legal_basis: policy.legal_basis,
      status: policy.status,
      created_at: policy.created_at,
    },
  });
});

export default router;
