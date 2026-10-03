import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import JobOverview from './pages/JobOverview';
import Jobs from './pages/Jobs';
import StageTracker from './pages/StageTracker';
import Leads from './pages/Leads';
import Checklists from './pages/Checklists';
import Payments from './pages/Payments';
import Materials from './pages/Materials';
import DailyTasks from './pages/DailyTasks';
import Snags from './pages/Snags';
import Handover from './pages/Handover';
import Profitability from './pages/Profitability';
import { getJobs } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    getJobs().then(res => setJobCount(res.data.length)).catch(() => {});
  }, [activeTab]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Content Area */}
      <div className="content-area">
        <Topbar jobCount={jobCount} />

        <main>
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'overview' && <JobOverview />}
          {activeTab === 'leads' && <Leads />}
          {activeTab === 'jobs' && <Jobs />}
          {activeTab === 'stages' && <StageTracker />}
          {activeTab === 'checklists' && <Checklists />}
          {activeTab === 'payments' && <Payments />}
          {activeTab === 'materials' && <Materials />}
          {activeTab === 'daily' && <DailyTasks />}
          {activeTab === 'snags' && <Snags />}
          {activeTab === 'handover' && <Handover />}
          {activeTab === 'profitability' && <Profitability />}
        </main>

        <footer>
          Shared, live data connected to Node.js &amp; PostgreSQL backend. Job No. links every module.
        </footer>
      </div>
    </div>
  );
}
