import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const users = db
    .prepare('SELECT * FROM users WHERE tenant_id = ? ORDER BY created_at DESC')
    .all(req.user.tenant_id);

  res.json({
    success: true,
    message: 'OK',
    data: users.map((u) => ({
      user_id: u.user_id,
      tenant_id: u.tenant_id,
      external_user_id: u.external_user_id,
      external_provider: u.external_provider,
      primary_email: u.primary_email,
      display_name: u.display_name,
      department: u.department,
      title: u.title,
      manager_external_id: u.manager_external_id,
      account_status: u.account_status,
      role_id: u.role_id,
      is_service_account: Boolean(u.is_service_account),
      mfa_enabled: Boolean(u.mfa_enabled),
      last_synced_at: u.last_synced_at,
      created_at: u.created_at,
    })),
  });
});

router.post('/', authenticate, (req, res) => {
  const {
    user_id,
    primary_email,
    display_name,
    department,
    title,
    role_id,
  } = req.body;

  if (!primary_email) {
    return res.json({ success: false, message: 'primary_email is required', data: null });
  }

  const existing = db.prepare('SELECT user_id FROM users WHERE primary_email = ?').get(primary_email);
  if (existing) {
    return res.json({ success: false, message: 'User with this email already exists', data: null });
  }

  const newId = user_id || uuidv4();
  const defaultPassword = bcrypt.hashSync('changeme123', 10);

  db.prepare(
    `INSERT INTO users (user_id, tenant_id, primary_email, password_hash, display_name, department, title, role_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId,
    req.user.tenant_id,
    primary_email,
    defaultPassword,
    display_name || null,
    department || null,
    title || null,
    role_id || null
  );

  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(newId);

  db.prepare(
    `INSERT INTO audit_logs (audit_log_id, tenant_id, actor_user_id, action, target_type, target_id, outcome)
     VALUES (?, ?, ?, 'user.created', 'user', ?, 'Success')`
  ).run(uuidv4(), req.user.tenant_id, req.user.user_id, newId);

  res.json({
    success: true,
    message: 'User created',
    data: {
      user_id: user.user_id,
      tenant_id: user.tenant_id,
      external_user_id: user.external_user_id,
      external_provider: user.external_provider,
      primary_email: user.primary_email,
      display_name: user.display_name,
      department: user.department,
      title: user.title,
      manager_external_id: user.manager_external_id,
      account_status: user.account_status,
      role_id: user.role_id,
      is_service_account: Boolean(user.is_service_account),
      mfa_enabled: Boolean(user.mfa_enabled),
      last_synced_at: user.last_synced_at,
      created_at: user.created_at,
    },
  });
});

export default router;
