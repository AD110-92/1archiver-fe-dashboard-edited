import React, { useState, useEffect } from 'react';
import { Server, Plus, RefreshCw, X, Mail, Shield } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useMailboxStore } from '../src/store/mailboxStore';

export const DataSources: React.FC = () => {
  const { mailboxes, loading, syncing, error, fetchMailboxes, createMailbox, syncMailbox } = useMailboxStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email_address: '',
    source_type: 'email',
    imap_host: '',
    imap_port: 993,
    imap_username: '',
    imap_password: '',
    use_ssl: true,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchMailboxes();
  }, [fetchMailboxes]);

  const handleCreate = async () => {
    if (!formData.email_address) return;
    setIsCreating(true);
    const res = await createMailbox(formData);
    setIsCreating(false);
    if (res.success) {
      setIsModalOpen(false);
      setFormData({
        email_address: '',
        source_type: 'email',
        imap_host: '',
        imap_port: 993,
        imap_username: '',
        imap_password: '',
        use_ssl: true,
      });
    } else {
      alert(res.message);
    }
  };

  const handleSync = async (mailboxId: string) => {
    setSyncResult(null);
    const res = await syncMailbox(mailboxId);
    if (res.success && res.data) {
      setSyncResult(`Archived ${res.data.archived_count} new emails`);
    } else {
      setSyncResult(res.message || 'Sync failed');
    }
    setTimeout(() => setSyncResult(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Sources</h1>
          <p className="text-slate-500 mt-1 text-sm">Connect and manage email integrations for archiving.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>+ Add Integration</Button>
      </div>

      {syncResult && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {syncResult}
        </div>
      )}

      <Card>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">Source Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last Sync</th>
              <th className="p-4">Items Ingested</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">Loading data sources...</td></tr>
            ) : mailboxes?.map((mb) => (
              <tr key={mb.mailbox_id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">{mb.email_address}</div>
                      <div className="text-xs text-slate-400 font-mono">{mb.mailbox_id.substring(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 capitalize">{mb.source_type.replace('_', ' ')}</td>
                <td className="p-4"><Badge variant="success">Healthy</Badge></td>
                <td className="p-4 text-slate-500">{new Date(mb.created_at).toLocaleDateString()}</td>
                <td className="p-4 font-mono">-</td>
                <td className="p-4 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw className={`w-3 h-3 ${syncing === mb.mailbox_id ? 'animate-spin' : ''}`} />}
                    onClick={() => handleSync(mb.mailbox_id)}
                    disabled={syncing === mb.mailbox_id}
                  >
                    {syncing === mb.mailbox_id ? 'Syncing...' : 'Sync'}
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && mailboxes?.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">No data sources found. Add an integration to get started.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Add Integration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Email Integration</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 outline-none"
                  placeholder="mailbox@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source Type</label>
                <select
                  value={formData.source_type}
                  onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                >
                  <option value="email">Email (Generic)</option>
                  <option value="exchange">Microsoft Exchange</option>
                  <option value="google_workspace">Google Workspace</option>
                </select>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">IMAP Configuration (Optional)</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">IMAP Host</label>
                    <input
                      type="text"
                      value={formData.imap_host}
                      onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      placeholder="imap.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Port</label>
                    <input
                      type="number"
                      value={formData.imap_port}
                      onChange={(e) => setFormData({ ...formData, imap_port: parseInt(e.target.value) || 993 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                    <input
                      type="text"
                      value={formData.imap_username}
                      onChange={(e) => setFormData({ ...formData, imap_username: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                    <input
                      type="password"
                      value={formData.imap_password}
                      onChange={(e) => setFormData({ ...formData, imap_password: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      placeholder="App password"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 mt-3 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.use_ssl}
                    onChange={(e) => setFormData({ ...formData, use_ssl: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Use SSL/TLS
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!formData.email_address || isCreating}>
                  {isCreating ? 'Adding...' : 'Add Integration'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
