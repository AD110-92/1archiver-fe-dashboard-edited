import React, { useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  Database,
  ShieldCheck,
  HardDrive,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, StatCard } from '../components/UI';
import { useLegalHoldsStore } from '../src/store/legalHoldsStore';
import { useSearchStore } from '../src/store/searchStore';
import { useAuditLogStore } from '../src/store/auditLogStore';

const ingestionData = [
  { name: '00:00', emails: 4000, files: 2400 },
  { name: '04:00', emails: 3000, files: 1398 },
  { name: '08:00', emails: 9800, files: 6000 },
  { name: '12:00', emails: 12000, files: 8500 },
  { name: '16:00', emails: 15000, files: 9200 },
  { name: '20:00', emails: 8000, files: 4300 },
  { name: '23:59', emails: 5000, files: 3000 },
];

interface OverviewProps {
  onNavigate?: (view: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const { holds, fetchHolds, loading: holdsLoading } = useLegalHoldsStore();
  const { results: searchStats, executeSearch } = useSearchStore();
  const { logs, fetchLogs, loading: logsLoading } = useAuditLogStore();

  useEffect(() => {
    fetchHolds();
    executeSearch(); // Fetches all results to get total count
    fetchLogs();
  }, [fetchHolds, executeSearch, fetchLogs]);

  const totalItems = searchStats?.total_hits || 0;
  const activeHoldsCount = holds?.filter(h => h.status === 'active').length || 0;
  const recentLogs = logs?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Health Overview</h1>
          <p className="text-slate-500 mt-1 text-sm">Real-time system posture and risk indicators.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          System Operational
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Archived Items"
          value={totalItems.toLocaleString()}
          trend="System Total"
          trendUp={true}
          icon={<Database className="w-5 h-5" />}
        />
        <StatCard
          label="Active Legal Holds"
          value={holdsLoading ? "..." : activeHoldsCount.toString()}
          trend={holdsLoading ? "Loading..." : `${holds?.length || 0} Total`}
          trendUp={activeHoldsCount === 0}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          label="Ingestion Health"
          value="99.98%"
          trend="-0.01%"
          trendUp={false}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          label="Storage Usage (TB)"
          value="450.2"
          trend="62% Capacity"
          trendUp={true}
          icon={<HardDrive className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingestion Chart */}
        <Card title="Ingestion Throughput (Last 24h)" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ingestionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                  itemStyle={{ fontSize: '12px', color: '#1e293b' }}
                />
                <Bar dataKey="emails" name="Email Archive" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="files" name="File System" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Events */}
        <Card title="Recent Audit Events" className="lg:col-span-1">
          <div className="space-y-4">
            {logsLoading ? (
              <div className="text-sm text-slate-500">Loading events...</div>
            ) : recentLogs.map((log) => (
              <div key={log.audit_log_id} className="flex gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div className="mt-0.5">
                  {log.outcome === 'Failure' ? (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{log.action}</div>
                  <div className="flex gap-2 mt-1 text-xs text-slate-500">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className="font-mono truncate max-w-[100px]">{log.actor_user_id}</span>
                  </div>
                </div>
              </div>
            ))}
            {!logsLoading && recentLogs.length === 0 && (
              <div className="text-sm text-slate-500">No recent events found.</div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button onClick={() => onNavigate?.('audit')} className="text-sm font-medium text-blue-700 hover:text-blue-800">View System Log &rarr;</button>
          </div>
        </Card>
      </div>

      {/* Infrastructure Status Banner */}
      <div className="bg-slate-900 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-800 rounded">
            <HardDrive className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Infrastructure Status: Optimal</h4>
            <p className="text-xs text-slate-400">All 12 archive nodes are online. Index latency: 45ms.</p>
          </div>
        </div>
        <div className="mt-3 md:mt-0 flex gap-4 text-xs font-mono text-slate-400">
          <span>BUILD: v4.2.0-rc1</span>
          <span>ENV: PROD-US-EAST</span>
        </div>
      </div>
    </div>
  );
};
