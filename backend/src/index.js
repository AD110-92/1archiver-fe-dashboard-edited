import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import './db.js'; // initialize database tables

import authRouter from './routes/auth.js';
import mailboxesRouter from './routes/mailboxes.js';
import searchRouter from './routes/search.js';
import legalHoldsRouter from './routes/legalHolds.js';
import auditLogsRouter from './routes/auditLogs.js';
import retentionRouter from './routes/retention.js';
import usersRouter from './routes/users.js';
import rolesRouter from './routes/roles.js';
import tenantsRouter from './routes/tenants.js';
import messagesRouter from './routes/messages.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'OK', data: { status: 'healthy' } });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/mailboxes', mailboxesRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/legal-holds', legalHoldsRouter);
app.use('/api/v1/audit-logs', auditLogsRouter);
app.use('/api/v1/retention-policies', retentionRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/roles', rolesRouter);
app.use('/api/v1/tenants', tenantsRouter);
app.use('/api/v1/messages', messagesRouter);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`1Archiver backend running on http://0.0.0.0:${config.port}`);
});
