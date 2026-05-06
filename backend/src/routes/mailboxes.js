import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import db from '../db.js';
import { syncMailbox } from '../services/emailArchiver.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  const mailboxes = db
    .prepare('SELECT * FROM mailboxes WHERE tenant_id = ? ORDER BY created_at DESC')
    .all(req.user.tenant_id);

  res.json({
    success: true,
    message: 'OK',
    data: mailboxes.map((m) => ({
      mailbox_id: m.mailbox_id,
      tenant_id: m.tenant_id,
      source_type: m.source_type,
      external_mailbox_id: m.external_mailbox_id,
      email_address: m.email_address,
      created_at: m.created_at,
    })),
  });
});

router.post('/', authenticate, (req, res) => {
  const {
    source_type = 'email',
    email_address,
    imap_host,
    imap_port = 993,
    imap_username,
    imap_password,
    use_ssl = true,
  } = req.body;

  if (!email_address) {
    return res.json({ success: false, message: 'email_address is required', data: null });
  }

  const mailbox_id = uuidv4();
  db.prepare(
    `INSERT INTO mailboxes (mailbox_id, tenant_id, source_type, external_mailbox_id, email_address,
      imap_host, imap_port, imap_username, imap_password, use_ssl)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    mailbox_id,
    req.user.tenant_id,
    source_type,
    email_address,
    email_address,
    imap_host || null,
    imap_port,
    imap_username || null,
    imap_password || null,
    use_ssl ? 1 : 0
  );

  db.prepare(
    `INSERT INTO audit_logs (audit_log_id, tenant_id, actor_user_id, action, target_type, target_id, outcome)
     VALUES (?, ?, ?, 'mailbox.created', 'mailbox', ?, 'Success')`
  ).run(uuidv4(), req.user.tenant_id, req.user.user_id, mailbox_id);

  const mailbox = db.prepare('SELECT * FROM mailboxes WHERE mailbox_id = ?').get(mailbox_id);

  res.json({
    success: true,
    message: 'Mailbox created',
    data: {
      mailbox_id: mailbox.mailbox_id,
      tenant_id: mailbox.tenant_id,
      source_type: mailbox.source_type,
      external_mailbox_id: mailbox.external_mailbox_id,
      email_address: mailbox.email_address,
      created_at: mailbox.created_at,
    },
  });
});

router.post('/:mailboxId/sync', authenticate, async (req, res) => {
  const mailbox = db
    .prepare('SELECT * FROM mailboxes WHERE mailbox_id = ? AND tenant_id = ?')
    .get(req.params.mailboxId, req.user.tenant_id);

  if (!mailbox) {
    return res.status(404).json({ success: false, message: 'Mailbox not found', data: null });
  }

  try {
    const count = await syncMailbox(db, mailbox, req.user.user_id);
    res.json({ success: true, message: `Synced ${count} new emails`, data: { archived_count: count } });
  } catch (err) {
    res.json({ success: false, message: `Sync failed: ${err.message}`, data: null });
  }
});

export default router;
