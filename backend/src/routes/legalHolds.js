import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import db from '../db.js';
import crypto from 'crypto';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const holds = db
    .prepare('SELECT * FROM legal_holds WHERE tenant_id = ? ORDER BY created_at DESC')
    .all(req.user.tenant_id);

  res.json({
    success: true,
    message: 'OK',
    data: holds.map((h) => ({
      legal_hold_id: h.legal_hold_id,
      tenant_id: h.tenant_id,
      reason: h.reason,
      case_number: h.case_number,
      created_by_user_id: h.created_by_user_id,
      status: h.status,
      custodian_count: h.custodian_count,
      created_at: h.created_at,
    })),
  });
});

router.post('/', authenticate, (req, res) => {
  const { reason, case_number, custodian_ids = [] } = req.body;

  if (!reason) {
    return res.json({ success: false, message: 'Reason is required', data: null });
  }

  const holdId = uuidv4();
  db.prepare(
    `INSERT INTO legal_holds (legal_hold_id, tenant_id, reason, case_number, created_by_user_id, custodian_count)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(holdId, req.user.tenant_id, reason, case_number || null, req.user.user_id, custodian_ids.length);

  const auditHash = crypto.createHash('sha256').update(`${holdId}:${reason}:${Date.now()}`).digest('hex');
  db.prepare(
    `INSERT INTO audit_logs (audit_log_id, tenant_id, actor_user_id, action, target_type, target_id, outcome, hash)
     VALUES (?, ?, ?, 'legal_hold.created', 'legal_hold', ?, 'Success', ?)`
  ).run(uuidv4(), req.user.tenant_id, req.user.user_id, holdId, auditHash);

  const hold = db.prepare('SELECT * FROM legal_holds WHERE legal_hold_id = ?').get(holdId);

  res.json({
    success: true,
    message: 'Legal hold created',
    data: {
      legal_hold_id: hold.legal_hold_id,
      tenant_id: hold.tenant_id,
      reason: hold.reason,
      case_number: hold.case_number,
      created_by_user_id: hold.created_by_user_id,
      status: hold.status,
      custodian_count: hold.custodian_count,
      created_at: hold.created_at,
    },
  });
});

export default router;
