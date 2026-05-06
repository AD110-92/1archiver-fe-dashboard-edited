import React, { useState } from 'react';
import { Search as SearchIcon, Filter, Download, Plus, X, Calendar, User, FileText, Eye } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useSearchStore } from '../src/store/searchStore';
import { api } from '../src/lib/api';

interface MessageDetail {
  message_id: string;
  subject: string;
  sender: string;
  recipients: string[];
  body_text: string;
  body_html: string;
  message_date: string;
  source_type: string;
  created_at: string;
}

export const Search: React.FC = () => {
  const {
    query,
    filters,
    results,
    loading,
    error,
    setQuery,
    setFilters,
    executeSearch
  } = useSearchStore();

  const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
  const [dateTo, setDateTo] = useState(filters?.date_to || '');
  const [custodian, setCustodian] = useState(filters?.custodian || '');
  const [sourceType, setSourceType] = useState(filters?.source_type || '');
  const [page, setPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<MessageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleSearch = (targetPage = 1) => {
    setPage(targetPage);
    setFilters({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      custodian: custodian || undefined,
      source_type: sourceType || undefined
    });
    executeSearch(targetPage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(1);
    }
  };

  const handleViewMessage = async (messageId: string) => {
    setLoadingDetail(true);
    try {
      const response = await api.get<MessageDetail>(`/messages/${messageId}`);
      if (response.success && response.data) {
        setSelectedMessage(response.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExportCSV = () => {
    if (!results?.hits || results.hits.length === 0) return;

    const headers = ['Date', 'Source', 'Sender', 'Recipients', 'Subject', 'Content Snippet'];
    const rows = results.hits.map((item) => [
      new Date(item.created_at).toLocaleDateString(),
      item.source_type,
      item.sender,
      item.recipients.join('; '),
      item.subject,
      item.content_snippet.replace(/"/g, '""'),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1archiver-search-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Search & eDiscovery</h1>
          <p className="text-slate-500 mt-1 text-sm">Deterministic retrieval across all archived datasets.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExportCSV} disabled={!results?.hits?.length}>Export Report</Button>
          <Button icon={<Plus className="w-4 h-4" />}>New Case</Button>
        </div>
      </div>

      {/* Search Builder */}
      <Card className="bg-slate-50 border-slate-200">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search keywords, phrases, or message IDs..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
              />
            </div>
            <Button variant="primary" className="px-8" onClick={() => handleSearch(1)} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 items-center">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-300 rounded text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="outline-none text-slate-700 w-28"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="outline-none text-slate-700 w-28"
              />
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-300 rounded text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Custodian..."
                value={custodian}
                onChange={e => setCustodian(e.target.value)}
                className="outline-none text-slate-700 w-32"
              />
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-300 rounded text-sm">
              <FileText className="w-4 h-4 text-slate-400" />
              <select
                value={sourceType}
                onChange={e => setSourceType(e.target.value)}
                className="outline-none text-slate-700 bg-transparent"
              >
                <option value="">All Sources</option>
                <option value="exchange">Exchange</option>
                <option value="google_workspace">Google Workspace</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Table */}
      <Card title={`Results (${results?.total_hits || 0} items found in ${results?.took_ms || 0}ms)`} className="overflow-hidden">
        <div className="overflow-x-auto">
          {error ? (
            <div className="p-6 text-center text-rose-500">{error}</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Sender / Recipient</th>
                  <th className="px-4 py-3">Subject / Content</th>
                  <th className="px-4 py-3">Policy</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results?.hits.map((item) => (
                  <tr key={item.message_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3"><input type="checkbox" className="rounded border-slate-300" /></td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-xs">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.source_type === 'exchange' ? 'info' : 'neutral'}>{item.source_type}</Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      <div className="font-medium text-slate-900">{item.sender}</div>
                      <div className="text-slate-400 text-xs">{item.recipients.join(', ')}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[300px] truncate text-slate-700" title={item.content_snippet}>
                      <div className="font-medium">{item.subject}</div>
                      <div className="text-xs text-slate-500 truncate">{item.content_snippet}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        {item.policy_name || 'Default'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewMessage(item.message_id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {(!results?.hits || results.hits.length === 0) && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No results found. Try adjusting your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Showing {results?.hits.length || 0} of {results?.total_hits || 0} results (Page {page})</span>
          <div className="flex gap-2">
            <button
              className="disabled:opacity-50 px-3 py-1 border rounded hover:bg-slate-100"
              disabled={page === 1 || loading}
              onClick={() => handleSearch(page - 1)}
            >Previous</button>
            <button
              className="px-3 py-1 border rounded hover:bg-slate-100 disabled:opacity-50"
              disabled={loading || (results?.hits.length || 0) < 20}
              onClick={() => handleSearch(page + 1)}
            >Next</button>
          </div>
        </div>
      </Card>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 truncate pr-4">{selectedMessage.subject || '(No Subject)'}</h3>
              <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 font-medium">From:</span>
                  <span className="ml-2 text-slate-900">{selectedMessage.sender}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Date:</span>
                  <span className="ml-2 text-slate-900">{selectedMessage.message_date ? new Date(selectedMessage.message_date).toLocaleString() : 'Unknown'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-medium">To:</span>
                  <span className="ml-2 text-slate-900">{selectedMessage.recipients?.join(', ') || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Source:</span>
                  <Badge variant="info">{selectedMessage.source_type}</Badge>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Archived:</span>
                  <span className="ml-2 text-slate-600 text-xs font-mono">{new Date(selectedMessage.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Message Body</h4>
                {selectedMessage.body_html ? (
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 border border-slate-200 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }} />
                ) : (
                  <pre className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap border border-slate-200">{selectedMessage.body_text || '(Empty body)'}</pre>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Message ID: {selectedMessage.message_id}
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <p className="text-slate-600">Loading message...</p>
          </div>
        </div>
      )}
    </div>
  );
};
