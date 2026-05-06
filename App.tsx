import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Server,
  Archive,
  Search as SearchIcon,
  Scale,
  Clock,
  Shield,
  Users,
  Database,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { Overview } from './pages/Overview';
import { Search } from './pages/Search';
import { AuditLogs } from './pages/AuditLogs';
import { Archives } from './pages/Archives';
import { LegalHolds } from './pages/LegalHolds';
import { RetentionPolicies } from './pages/RetentionPolicies';
import { AccessControl } from './pages/AccessControl';
import { Storage } from './pages/Storage';
import { Settings as SettingsPage } from './pages/Settings';
import { DataSources } from './pages/DataSources';
import { ViewState } from './types';
import { Badge } from './components/UI';
import { Login } from './pages/Login';
import { useAuthStore } from './src/store/authStore';
import { useAccessControlStore } from './src/store/accessControlStore';
import { useTenantStore } from './src/store/tenantStore';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { roles, fetchRoles } = useAccessControlStore();
  const { tenant, fetchTenant } = useTenantStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (roles.length === 0) fetchRoles();
      if (!tenant && user?.tenant_id) fetchTenant(user.tenant_id);
    }
  }, [isAuthenticated, roles.length, fetchRoles, tenant, user?.tenant_id, fetchTenant]);

  const roleName = roles.find(r => r.role_id === user?.role_id)?.name || 'User';
  const displayName = user?.display_name || user?.primary_email || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!isAuthenticated) {
    return <Login />;
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'sources', label: 'Data Sources', icon: <Server size={20} /> },
    { id: 'archives', label: 'Archives', icon: <Archive size={20} /> },
    { id: 'search', label: 'Search & eDiscovery', icon: <SearchIcon size={20} /> },
    { id: 'holds', label: 'Legal Holds', icon: <Scale size={20} /> },
    { id: 'retention', label: 'Retention Policies', icon: <Clock size={20} /> },
    { id: 'audit', label: 'Audit Logs', icon: <Shield size={20} /> },
    { id: 'rbac', label: 'Access Control', icon: <Users size={20} /> },
    { id: 'storage', label: 'Storage & Infra', icon: <Database size={20} /> },
    { id: 'settings', label: 'System Settings', icon: <Settings size={20} /> },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'overview': return <Overview onNavigate={(v) => setCurrentView(v as ViewState)} />;
      case 'search': return <Search />;
      case 'audit': return <AuditLogs />;
      case 'archives': return <Archives />;
      case 'holds': return <LegalHolds />;
      case 'retention': return <RetentionPolicies />;
      case 'rbac': return <AccessControl />;
      case 'storage': return <Storage />;
      case 'settings': return <SettingsPage />;
      case 'sources': return <DataSources />;
      default: return <div>Page not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'} border-r border-slate-800`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">1A</div>
            {sidebarOpen && <span className="font-semibold text-white tracking-tight">1Archiver</span>}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id as ViewState)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${currentView === item.id
                    ? 'bg-blue-900/50 text-blue-100 border border-blue-800/50'
                    : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span className={currentView === item.id ? 'text-blue-400' : 'text-slate-400'}>{item.icon}</span>
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded hover:bg-slate-800 transition-colors text-slate-400"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tenant</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                {tenant?.name || 'Loading...'}
                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-2"></span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Environment</span>
              <Badge variant="neutral">{tenant?.deployment_type === 'on_prem' ? 'On-Premises / Air-Gapped' : tenant?.deployment_type || 'Unknown'}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                <div className="text-xs text-slate-500">{roleName}</div>
              </div>
              <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-medium">{initials}</div>
              <button onClick={logout} className="text-slate-400 hover:text-rose-600 ml-2">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
