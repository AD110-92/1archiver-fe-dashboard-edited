import Database from 'better-sqlite3';
import { config } from './config.js';

const db = new Database(config.dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    tenant_id TEXT PRIMARY KEY,
    deployment_type TEXT DEFAULT 'on_premise',
    name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS roles (
    role_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id),
    allowed_modules TEXT DEFAULT '[]',
    name TEXT,
    description TEXT,
    user_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id),
    external_user_id TEXT,
    external_provider TEXT,
    primary_email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    department TEXT,
    title TEXT,
    manager_external_id TEXT,
    account_status TEXT DEFAULT 'active',
    role_id TEXT REFERENCES roles(role_id),
    is_service_account INTEGER DEFAULT 0,
    mfa_enabled INTEGER DEFAULT 0,
    last_synced_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mailboxes (
    mailbox_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id),
    source_type TEXT NOT NULL,
    external_mailbox_id TEXT NOT NULL,
    email_address TEXT NOT NULL,
    imap_host TEXT,
    imap_port INTEGER DEFAULT 993,
    imap_username TEXT,
    imap_password TEXT,
    use_ssl INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS archived_messages (
    message_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id),
    mailbox_id TEXT NOT NULL REFERENCES mailboxes(mailbox_id),
    subject TEXT,
    sender TEXT,
    recipients TEXT,
    body_text TEXT,
    body_html TEXT,
    raw_headers TEXT,
    message_date TEXT,
    source_type TEXT DEFAULT 'email',
    indexed_at TEXT DEFAULT (datetime('now')),
    retention_expiry_ts TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS retention_policies (
    retention_policy_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id),
    retention_days INTEGER NOT NULL DEFAULT 365,
    policy_name TEXT,
    description TEXT,
    legal_basis TEXT DEFAULT 'regulatory',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS legal_holds (
    legal_hold_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id),
    reason TEXT NOT NULL,
    case_number TEXT,
    created_by_user_id TEXT REFERENCES users(user_id),
    status TEXT DEFAULT 'active',
    custodian_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id),
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    metadata TEXT DEFAULT '{}',
    outcome TEXT DEFAULT 'Success',
    hash TEXT
  );
`);

export default db;
