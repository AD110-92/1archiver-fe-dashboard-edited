import React, { useEffect, useState, useMemo } from 'react';
import { Filter, Download, Search, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useAuditLogStore } from '../src/store/auditLogStore';

export const AuditLogs: React.FC = () => {
   const { logs, loading, error, fetchLogs } = useAuditLogStore();
   const [filterText, setFilterText] = useState('');

   useEffect(() => {
      fetchLogs();
   }, [fetchLogs]);

   const filteredLogs = useMemo(() => {
      if (!logs || !filterText) return logs;
      const lower = filterText.toLowerCase();
      return logs.filter(
         (log) =>
            log.actor_user_id.toLowerCase().includes(lower) ||
            log.action.toLowerCase().includes(lower) ||
            log.target_type.toLowerCase().includes(lower) ||
            log.target_id.toLowerCase().includes(lower) ||
            (log.outcome || '').toLowerCase().includes(lower)
      );
   }, [logs, filterText]);

   const handleExportCSV = () => {
      if (!filteredLogs || filteredLogs.length === 0) return;
      const headers = ['Timestamp', 'Actor', 'Action', 'Resource Type', 'Resource ID', 'Outcome', 'Hash'];
      const rows = filteredLogs.map((log) => [
         new Date(log.timestamp).toLocaleString(),
         log.actor_user_id,
         log.action,
         log.target_type,
         log.target_id,
         log.outcome || '',
         log.hash || '',
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `1archiver-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">System Audit Logs</h1>
               <p className="text-slate-500 mt-1 text-sm">Immutable record of all administrative and system actions.</p>
            </div>
            <div className="flex gap-2">
               <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>Export Signed CSV</Button>
            </div>
         </div>

         <Card>
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
               <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                     type="text"
                     placeholder="Filter by user, action, or resource ID..."
                     value={filterText}
                     onChange={(e) => setFilterText(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                  />
               </div>
               <Button variant="secondary" icon={<Filter className="w-4 h-4" />} onClick={() => setFilterText('')}>Clear</Button>
            </div>

            <div className="overflow-x-auto">
               {loading ? (
                  <div className="p-6 text-center text-slate-500">Loading audit logs...</div>
               ) : error ? (
                  <div className="p-6 text-center text-rose-500">{error}</div>
               ) : (
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                           <th className="px-6 py-3">Timestamp</th>
                           <th className="px-6 py-3">Actor</th>
                           <th className="px-6 py-3">Action</th>
                           <th className="px-6 py-3">Resource</th>
                           <th className="px-6 py-3">Outcome</th>
                           <th className="px-6 py-3">Integrity Hash</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {filteredLogs?.map((log) => (
                           <tr key={log.audit_log_id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 whitespace-nowrap text-slate-600 font-mono text-xs">
                                 {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-3">
                                 <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                                       {log.actor_user_id.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-slate-900 font-mono text-xs">{log.actor_user_id.substring(0, 8)}...</span>
                                 </div>
                              </td>
                              <td className="px-6 py-3 text-slate-700">{log.action}</td>
                              <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                                 {log.target_type}:{log.target_id.substring(0, 8)}...
                              </td>
                              <td className="px-6 py-3">
                                 <Badge variant={log.outcome === 'Success' ? 'success' : 'error'}>{log.outcome || 'Unknown'}</Badge>
                              </td>
                              <td className="px-6 py-3 font-mono text-xs text-slate-400 truncate max-w-[150px]" title={log.hash || ''}>
                                 {log.hash ? log.hash.substring(0, 16) + '...' : '-'}
                              </td>
                           </tr>
                        ))}
                        {filteredLogs?.length === 0 && (
                           <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                 {filterText ? 'No logs match your filter.' : 'No audit logs found.'}
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               )}
            </div>
         </Card>
      </div>
   );
};
