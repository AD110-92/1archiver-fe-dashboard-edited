import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export function syncMailbox(db, mailbox, actorUserId) {
  return new Promise((resolve, reject) => {
    if (!mailbox.imap_host || !mailbox.imap_username) {
      return resolve(0);
    }

    const imap = new Imap({
      user: mailbox.imap_username,
      password: mailbox.imap_password || '',
      host: mailbox.imap_host,
      port: mailbox.imap_port || 993,
      tls: Boolean(mailbox.use_ssl),
      tlsOptions: { rejectUnauthorized: false },
    });

    let archivedCount = 0;

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        if (!box.messages.total) {
          imap.end();
          return resolve(0);
        }

        const existingIds = new Set(
          db
            .prepare('SELECT message_id FROM archived_messages WHERE mailbox_id = ?')
            .all(mailbox.mailbox_id)
            .map((r) => r.message_id)
        );

        const fetch = imap.seq.fetch('1:*', { bodies: '' });

        fetch.on('message', (msg) => {
          let rawBuffer = Buffer.alloc(0);

          msg.on('body', (stream) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => {
              rawBuffer = Buffer.concat(chunks);
            });
          });

          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(rawBuffer);
              const messageId = parsed.messageId || uuidv4();

              if (existingIds.has(messageId)) return;

              const recipients = []
                .concat(
                  parsed.to?.value || [],
                  parsed.cc?.value || [],
                  parsed.bcc?.value || []
                )
                .map((r) => r.address || r.name || '')
                .filter(Boolean)
                .join(',');

              const sender =
                parsed.from?.value?.[0]?.address ||
                parsed.from?.value?.[0]?.name ||
                '';

              db.prepare(
                `INSERT OR IGNORE INTO archived_messages
                  (message_id, tenant_id, mailbox_id, subject, sender, recipients,
                   body_text, body_html, raw_headers, message_date, source_type)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              ).run(
                messageId.length < 255 ? messageId : uuidv4(),
                mailbox.tenant_id,
                mailbox.mailbox_id,
                parsed.subject || '',
                sender,
                recipients,
                parsed.text || '',
                parsed.html || '',
                JSON.stringify(parsed.headers ? [...parsed.headers] : []),
                parsed.date ? parsed.date.toISOString() : null,
                mailbox.source_type
              );
              archivedCount++;
              existingIds.add(messageId);
            } catch {
              // skip unparseable messages
            }
          });
        });

        fetch.once('error', (fetchErr) => {
          imap.end();
          reject(fetchErr);
        });

        fetch.once('end', () => {
          imap.end();
        });
      });
    });

    imap.once('end', () => {
      const auditHash = crypto
        .createHash('sha256')
        .update(`sync:${mailbox.mailbox_id}:${archivedCount}:${Date.now()}`)
        .digest('hex');

      db.prepare(
        `INSERT INTO audit_logs (audit_log_id, tenant_id, actor_user_id, action, target_type, target_id, metadata, outcome, hash)
         VALUES (?, ?, ?, 'mailbox.sync', 'mailbox', ?, ?, 'Success', ?)`
      ).run(
        uuidv4(),
        mailbox.tenant_id,
        actorUserId,
        mailbox.mailbox_id,
        JSON.stringify({ archived_count: archivedCount }),
        auditHash
      );

      resolve(archivedCount);
    });

    imap.once('error', (err) => {
      db.prepare(
        `INSERT INTO audit_logs (audit_log_id, tenant_id, actor_user_id, action, target_type, target_id, metadata, outcome)
         VALUES (?, ?, ?, 'mailbox.sync', 'mailbox', ?, ?, 'Failure')`
      ).run(
        uuidv4(),
        mailbox.tenant_id,
        actorUserId,
        mailbox.mailbox_id,
        JSON.stringify({ error: err.message?.slice(0, 200) })
      );
      reject(err);
    });

    imap.connect();
  });
}
