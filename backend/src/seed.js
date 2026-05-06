import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from './db.js';

const TENANT_ID = 'tenant-default-001';

// Clear existing data
db.exec(`
  DELETE FROM audit_logs;
  DELETE FROM archived_messages;
  DELETE FROM legal_holds;
  DELETE FROM retention_policies;
  DELETE FROM mailboxes;
  DELETE FROM users;
  DELETE FROM roles;
  DELETE FROM tenants;
`);

// Tenant
db.prepare('INSERT INTO tenants (tenant_id, deployment_type, name) VALUES (?, ?, ?)').run(
  TENANT_ID,
  'on_premise',
  'Global Corp'
);

// Roles
const adminRoleId = uuidv4();
const complianceRoleId = uuidv4();
const auditorRoleId = uuidv4();

db.prepare(
  'INSERT INTO roles (role_id, tenant_id, name, description, allowed_modules, user_count) VALUES (?, ?, ?, ?, ?, ?)'
).run(adminRoleId, TENANT_ID, 'Admin', 'Full system access with all privileges', '["*"]', 2);

db.prepare(
  'INSERT INTO roles (role_id, tenant_id, name, description, allowed_modules, user_count) VALUES (?, ?, ?, ?, ?, ?)'
).run(
  complianceRoleId,
  TENANT_ID,
  'Compliance Officer',
  'Manage retention, legal holds, and search',
  '["search","holds","retention","archives"]',
  3
);

db.prepare(
  'INSERT INTO roles (role_id, tenant_id, name, description, allowed_modules, user_count) VALUES (?, ?, ?, ?, ?, ?)'
).run(auditorRoleId, TENANT_ID, 'Auditor', 'Read-only access to audit logs and reports', '["audit","search"]', 1);

// Users
const adminUserId = uuidv4();
const hash = bcrypt.hashSync('admin123', 10);

db.prepare(
  `INSERT INTO users (user_id, tenant_id, primary_email, password_hash, display_name, department, title, role_id, account_status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(adminUserId, TENANT_ID, 'admin@globalcorp.com', hash, 'Sarah Chen', 'IT', 'System Administrator', adminRoleId, 'active');

const complianceUserId = uuidv4();
db.prepare(
  `INSERT INTO users (user_id, tenant_id, primary_email, password_hash, display_name, department, title, role_id, account_status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  complianceUserId,
  TENANT_ID,
  'compliance@globalcorp.com',
  bcrypt.hashSync('compliance123', 10),
  'James Wilson',
  'Legal',
  'Compliance Officer',
  complianceRoleId,
  'active'
);

const auditorUserId = uuidv4();
db.prepare(
  `INSERT INTO users (user_id, tenant_id, primary_email, password_hash, display_name, department, title, role_id, account_status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
).run(
  auditorUserId,
  TENANT_ID,
  'auditor@globalcorp.com',
  bcrypt.hashSync('auditor123', 10),
  'Maria Garcia',
  'Compliance',
  'Internal Auditor',
  auditorRoleId,
  'active'
);

// Mailboxes
const mb1 = uuidv4();
const mb2 = uuidv4();
const mb3 = uuidv4();

db.prepare(
  `INSERT INTO mailboxes (mailbox_id, tenant_id, source_type, external_mailbox_id, email_address)
   VALUES (?, ?, ?, ?, ?)`
).run(mb1, TENANT_ID, 'exchange', 'ex-001', 'legal-team@globalcorp.com');

db.prepare(
  `INSERT INTO mailboxes (mailbox_id, tenant_id, source_type, external_mailbox_id, email_address)
   VALUES (?, ?, ?, ?, ?)`
).run(mb2, TENANT_ID, 'google_workspace', 'gw-001', 'finance@globalcorp.com');

db.prepare(
  `INSERT INTO mailboxes (mailbox_id, tenant_id, source_type, external_mailbox_id, email_address)
   VALUES (?, ?, ?, ?, ?)`
).run(mb3, TENANT_ID, 'exchange', 'ex-002', 'hr@globalcorp.com');

// Sample archived messages
const senders = [
  'john.doe@partner.com',
  'legal-team@globalcorp.com',
  'ceo@globalcorp.com',
  'external@vendor.io',
  'finance@globalcorp.com',
];
const subjects = [
  'Q4 Financial Review - Confidential',
  'Re: Contract Amendment #2024-119',
  'Board Meeting Minutes - December',
  'Vendor Agreement Renewal',
  'Compliance Training Reminder',
  'Updated Privacy Policy Draft',
  'Data Retention Audit Results',
  'Re: Legal Hold Notice - Case #LH-2024-003',
  'Annual Security Assessment Report',
  'Employee Offboarding Checklist',
];

for (let i = 0; i < 25; i++) {
  const dateOffset = Math.floor(Math.random() * 90);
  const d = new Date();
  d.setDate(d.getDate() - dateOffset);

  db.prepare(
    `INSERT INTO archived_messages
      (message_id, tenant_id, mailbox_id, subject, sender, recipients, body_text, message_date, source_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    uuidv4(),
    TENANT_ID,
    [mb1, mb2, mb3][i % 3],
    subjects[i % subjects.length],
    senders[i % senders.length],
    'legal-team@globalcorp.com,compliance@globalcorp.com',
    `This is the body of email #${i + 1}. Contains important compliance-related content that has been archived per retention policy.`,
    d.toISOString(),
    ['exchange', 'google_workspace'][i % 2]
  );
}

// Retention policies
db.prepare(
  `INSERT INTO retention_policies (retention_policy_id, tenant_id, retention_days, policy_name, description, legal_basis, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
).run(uuidv4(), TENANT_ID, 2555, 'SEC 17a-4 Compliance', 'Financial records retention per SEC Rule 17a-4 requirements', 'SEC Rule 17a-4', 'active');

db.prepare(
  `INSERT INTO retention_policies (retention_policy_id, tenant_id, retention_days, policy_name, description, legal_basis, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
).run(uuidv4(), TENANT_ID, 1095, 'GDPR Data Retention', 'European data protection compliance for personal data', 'GDPR Art. 5(1)(e)', 'active');

db.prepare(
  `INSERT INTO retention_policies (retention_policy_id, tenant_id, retention_days, policy_name, description, legal_basis, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
).run(uuidv4(), TENANT_ID, 365, 'General Business Records', 'Standard retention for internal communications', 'Internal Policy', 'active');

// Legal holds
db.prepare(
  `INSERT INTO legal_holds (legal_hold_id, tenant_id, reason, case_number, created_by_user_id, status, custodian_count)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
).run(uuidv4(), TENANT_ID, 'SEC Investigation - Insider Trading Allegation', 'LH-2024-001', adminUserId, 'active', 12);

db.prepare(
  `INSERT INTO legal_holds (legal_hold_id, tenant_id, reason, case_number, created_by_user_id, status, custodian_count)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
).run(uuidv4(), TENANT_ID, 'Employment Dispute - Wrongful Termination', 'LH-2024-002', complianceUserId, 'active', 5);

db.prepare(
  `INSERT INTO legal_holds (legal_hold_id, tenant_id, reason, case_number, created_by_user_id, status, custodian_count)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
).run(uuidv4(), TENANT_ID, 'Contract Dispute - Vendor Services Agreement', 'LH-2023-015', adminUserId, 'released', 3);

// Audit logs
const actions = [
  { action: 'user.login', target_type: 'user', outcome: 'Success' },
  { action: 'search.executed', target_type: 'search', outcome: 'Success' },
  { action: 'legal_hold.created', target_type: 'legal_hold', outcome: 'Success' },
  { action: 'retention_policy.updated', target_type: 'retention_policy', outcome: 'Success' },
  { action: 'export.requested', target_type: 'report', outcome: 'Success' },
  { action: 'user.login', target_type: 'user', outcome: 'Failure' },
  { action: 'mailbox.sync', target_type: 'mailbox', outcome: 'Success' },
  { action: 'role.assigned', target_type: 'user', outcome: 'Success' },
];

for (let i = 0; i < 15; i++) {
  const a = actions[i % actions.length];
  const d = new Date();
  d.setHours(d.getHours() - i * 2);
  const auditHash = crypto
    .createHash('sha256')
    .update(`${a.action}:${i}:${d.toISOString()}`)
    .digest('hex');

  db.prepare(
    `INSERT INTO audit_logs (audit_log_id, tenant_id, actor_user_id, action, target_type, target_id, timestamp, outcome, hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    uuidv4(),
    TENANT_ID,
    [adminUserId, complianceUserId, auditorUserId][i % 3],
    a.action,
    a.target_type,
    uuidv4(),
    d.toISOString(),
    a.outcome,
    auditHash
  );
}

console.log('Database seeded successfully!');
console.log('');
console.log('Demo credentials:');
console.log('  Admin:      admin@globalcorp.com / admin123');
console.log('  Compliance: compliance@globalcorp.com / compliance123');
console.log('  Auditor:    auditor@globalcorp.com / auditor123');
