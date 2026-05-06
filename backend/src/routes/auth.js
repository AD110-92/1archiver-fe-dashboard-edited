import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import db from '../db.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password, tenant_id } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: 'Email and password are required', data: null });
  }

  let user;
  if (tenant_id) {
    user = db.prepare('SELECT * FROM users WHERE primary_email = ? AND tenant_id = ?').get(email, tenant_id);
  } else {
    user = db.prepare('SELECT * FROM users WHERE primary_email = ?').get(email);
  }

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.json({ success: false, message: 'Invalid email or password', data: null });
  }

  const token = jwt.sign(
    {
      user_id: user.user_id,
      tenant_id: user.tenant_id,
      email: user.primary_email,
      role_id: user.role_id || '',
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
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
      expires_at: expiresAt,
    },
  });
});

export default router;
