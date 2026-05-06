import React, { useEffect, useState } from 'react';
import { Filter, Download, Archive as ArchiveIcon, Lock, FileDigit, Mail, MessageSquare, X, RefreshCw } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useMailboxStore } from '../src/store/mailboxStore';
import { api } from '../src/lib/api';

interface ArchiveDetail {
  mailbox_id: string;
  email_address: string;
  source_type: string;
  created_at: string;
  message_count: number;
}

export const Archives: React.FC = () => {
  const { mailboxes, loading, syncing, error, fetchMailboxes, syncMailbox } = useMailboxStore();
  const [selectedDetail, setSelectedDetail] = useState<ArchiveDetail | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    fetchMailboxes();
  }, [fetchMailboxes]);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
      case 'exchange':
      case 'google_workspace': return <Mail className="w-4 h-4" />;
      case 'messaging':
      case 'slack': return <MessageSquare className="w-4 h-4" />;
      case 'file': return <FileDigit className="w-4 h-4" />;
      default: return <ArchiveIcon className="w-4 h-4" />;
    }
  };

  const handleDetails = async (mailbox: typeof mailboxes[0]) => {
    try {
      const response = await api.post<{ total_hits: number }>('/search', { query: '*', filters: {}, page: 1, page_size: 1 });
      setSelectedDetail({
        mailbox_id: mailbox.mailbox_id,
        email_address: mailbox.email_address,
        source_type: mailbox.source_type,
        created_at: mailbox.created_at,
        message_count: response.data?.total_hits || 0,
      });
    } catch {
      setSelectedDetail({
        mailbox_id: mailbox.mailbox_id,
        email_address: mailbox.email_address,
        source_type: mailbox.source_type,
        created_at: mailbox.created_at,
        message_count: 0,
      });
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
          <h1 className="text-2xl font-bold text-slate-900">Archives Explorer</h1>
          <p className="text-slate-500 mt-1 text-sm">Browse and manage immutable data sets stored in the vault.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>Filter</Button>
          <Button icon={<Download className="w-4 h-4" />}>Export Manifest</Button>
        </div>
      </div>

      {syncResult && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{syncResult}</div>
      )}

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading archives...</div>
          ) : error ? (
            <div className="p-6 text-center text-rose-500">{error}</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Dataset Name</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Date Range</th>
                  <th className="px-6 py-4">Retention</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mailboxes?.map((item) => (
                  <tr key={item.mailbox_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded text-slate-500">
                          {getIcon(item.source_type)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{item.email_address}</div>
                          <div className="text-xs text-slate-500 font-mono">{item.mailbox_id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-700 capitalize">{item.source_type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()} - Now
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">Default</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleSync(item.mailbox_id)}
                        className="text-slate-500 hover:text-slate-700 font-medium text-sm inline-flex items-center gap-1"
                        disabled={syncing === item.mailbox_id}
                      >
                        <RefreshCw className={`w-3 h-3 ${syncing === item.mailbox_id ? 'animate-spin' : ''}`} />
                        {syncing === item.mailbox_id ? 'Syncing' : 'Sync'}
                      </button>
                      <button
                        onClick={() => handleDetails(item)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {mailboxes?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No archives found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Archive Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Archive Details</h3>
              <button onClick={() => setSelectedDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address</span>
                <span className="font-medium text-slate-900">{selectedDetail.email_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source Type</span>
                <span className="capitalize">{selectedDetail.source_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Archive ID</span>
                <span className="font-mono text-xs">{selectedDetail.mailbox_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span>{new Date(selectedDetail.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Messages (All Archives)</span>
                <span className="font-mono">{selectedDetail.message_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Compliance Lock</span>
                <Badge variant="success">WORM Active</Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
