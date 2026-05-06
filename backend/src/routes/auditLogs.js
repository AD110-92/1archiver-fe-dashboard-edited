import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const logs = db
    .prepare('SELECT * FROM audit_logs WHERE tenant_id = ? ORDER BY timestamp DESC LIMIT 200')
    .all(req.user.tenant_id);

  res.json({
    success: true,
    message: 'OK',
    data: logs.map((l) => ({
      audit_log_id: l.audit_log_id,
      tenant_id: l.tenant_id,
      actor_user_id: l.actor_user_id,
      action: l.action,
      target_type: l.target_type,
      target_id: l.target_id,
      timestamp: l.timestamp,
      metadata: l.metadata,
      outcome: l.outcome,
      hash: l.hash,
    })),
  });
});

export default router;
