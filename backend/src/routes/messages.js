import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

router.get('/:messageId', authenticate, (req, res) => {
  const message = db
    .prepare('SELECT * FROM archived_messages WHERE message_id = ? AND tenant_id = ?')
    .get(req.params.messageId, req.user.tenant_id);

  if (!message) {
    return res.status(404).json({ success: false, message: 'Message not found', data: null });
  }

  res.json({
    success: true,
    message: 'OK',
    data: {
      message_id: message.message_id,
      tenant_id: message.tenant_id,
      mailbox_id: message.mailbox_id,
      subject: message.subject,
      sender: message.sender,
      recipients: message.recipients ? message.recipients.split(',').filter(Boolean) : [],
      body_text: message.body_text,
      body_html: message.body_html,
      message_date: message.message_date,
      source_type: message.source_type,
      indexed_at: message.indexed_at,
      retention_expiry_ts: message.retention_expiry_ts,
      created_at: message.created_at,
    },
  });
});

export default router;
