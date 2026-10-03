import React from 'react';
import {
  LayoutDashboard,
  Eye,
  Users,
  Briefcase,
  GitCommit,
  CheckSquare,
  CreditCard,
  Package,
  Calendar,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Moon,
  Sun
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'overview', label: 'Job Overview', icon: Eye },
  { id: 'leads', label: 'Leads (CRM)', icon: Users },
  { id: 'jobs', label: 'Jobs (Customer Master)', icon: Briefcase },
  { id: 'stages', label: 'Stage Tracker', icon: GitCommit },
  { id: 'checklists', label: 'Checklists', icon: CheckSquare },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'materials', label: 'Materials', icon: Package },
  { id: 'daily', label: 'Daily Tasks', icon: Calendar },
  { id: 'snags', label: 'Snags & Service', icon: AlertTriangle },
  { id: 'handover', label: 'Handover & Feedback', icon: FileCheck },
  { id: 'profitability', label: 'Profitability', icon: TrendingUp },
];

export default function Sidebar({ activeTab, setActiveTab, theme, toggleTheme }) {
  return (
    <aside className="sidebar">
      <h1>VUDFIT execution tracker</h1>
      <div className="syncline">
        <span className="dot on"></span>
        <span>Live — PostgreSQL API synced</span>
      </div>

      <nav>
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              className={isActive ? 'active' : ''}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--sub)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? <Sun style={{ width: '14px', height: '14px', color: '#f59e0b' }} /> : <Moon style={{ width: '14px', height: '14px' }} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
