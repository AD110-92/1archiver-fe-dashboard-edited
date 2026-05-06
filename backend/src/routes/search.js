import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();

router.post('/', authenticate, (req, res) => {
  const start = performance.now();
  const { query = '*', filters = {}, page = 1, page_size = 20 } = req.body;
  const tenantId = req.user.tenant_id;

  let sql = 'SELECT * FROM archived_messages WHERE tenant_id = ?';
  let countSql = 'SELECT COUNT(*) as total FROM archived_messages WHERE tenant_id = ?';
  const params = [tenantId];

  if (query && query !== '*') {
    const pattern = `%${query}%`;
    const clause = ' AND (subject LIKE ? OR body_text LIKE ? OR sender LIKE ? OR recipients LIKE ?)';
    sql += clause;
    countSql += clause;
    params.push(pattern, pattern, pattern, pattern);
  }

  if (filters.date_from) {
    sql += ' AND message_date >= ?';
    countSql += ' AND message_date >= ?';
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    sql += ' AND message_date <= ?';
    countSql += ' AND message_date <= ?';
    params.push(filters.date_to);
  }
  if (filters.custodian) {
    const cp = `%${filters.custodian}%`;
    sql += ' AND (sender LIKE ? OR recipients LIKE ?)';
    countSql += ' AND (sender LIKE ? OR recipients LIKE ?)';
    params.push(cp, cp);
  }
  if (filters.source_type) {
    sql += ' AND source_type = ?';
    countSql += ' AND source_type = ?';
    params.push(filters.source_type);
  }

  const totalRow = db.prepare(countSql).get(...params);
  const total = totalRow.total;

  const offset = (page - 1) * page_size;
  sql += ' ORDER BY message_date DESC LIMIT ? OFFSET ?';

  const messages = db.prepare(sql).all(...params, page_size, offset);

  const policy = db
    .prepare('SELECT policy_name FROM retention_policies WHERE tenant_id = ? LIMIT 1')
    .get(tenantId);

  const tookMs = Math.round(performance.now() - start);

  res.json({
    success: true,
    message: 'OK',
    data: {
      total_hits: total,
      took_ms: tookMs,
      hits: messages.map((m) => ({
        message_id: m.message_id,
        created_at: m.created_at,
        source_type: m.source_type || 'email',
        sender: m.sender || '',
        recipients: m.recipients ? m.recipients.split(',').filter(Boolean) : [],
        subject: m.subject || '',
        content_snippet: (m.body_text || '').slice(0, 200),
        policy_name: policy ? policy.policy_name : null,
      })),
    },
  });
});

export default router;
