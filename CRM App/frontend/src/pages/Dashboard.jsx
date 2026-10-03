import React, { useEffect, useState } from 'react';
import { getDashboardStats, getJobs } from '../services/api';
import {
  Briefcase,
  Users,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CONTROL_GATES = [
  "Gate 1 — Qualified Lead",
  "Gate 2 — Measurement Complete",
  "Gate 3 — Design Approved",
  "Gate 4 — Costing & Margin Approved",
  "Gate 5 — Commercial Confirmation / Advance",
  "Gate 6 — Production Release",
  "Gate 7 — Production QC Passed",
  "Gate 8 — Dispatch Ready",
  "Gate 9 — Site Ready",
  "Gate 10 — Installation / Snag Closed",
  "Gate 11 — Final Payment / Documentation",
  "Gate 12 — Project Closed"
];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, jobsRes] = await Promise.all([
        getDashboardStats(),
        getJobs()
      ]);
      setStats(statsRes.data);
      setJobs(jobsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN');

  const stageData = [
    { name: 'Enquiry', count: jobs.filter(j => j.current_stage?.includes('01')).length || 1 },
    { name: 'Design', count: jobs.filter(j => j.current_stage?.includes('Design') || j.current_stage?.includes('Pytha')).length || 1 },
    { name: 'Release', count: jobs.filter(j => j.current_stage?.includes('Release') || j.current_stage?.includes('Confirmation')).length || 1 },
    { name: 'Production', count: jobs.filter(j => j.current_stage?.includes('Production') || j.current_stage?.includes('Cutlist')).length || 1 },
    { name: 'Installation', count: jobs.filter(j => j.current_stage?.includes('Install') || j.current_stage?.includes('Dispatch')).length || 1 },
  ];

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading MIS Dashboard...</div>;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '12px', color: '#2563eb' }}>
            <Briefcase style={{ width: '28px', height: '28px' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Jobs</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats?.activeJobs || 0} / {stats?.totalJobs || 0}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '12px', color: '#10b981' }}>
            <Users style={{ width: '28px', height: '28px' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total CRM Leads</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats?.totalLeads || 0}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '12px', color: '#f59e0b' }}>
            <IndianRupee style={{ width: '28px', height: '28px' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Contract Value</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{fmt(stats?.totalRevenue)}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '12px', color: '#ef4444' }}>
            <AlertCircle style={{ width: '28px', height: '28px' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Open Snags</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats?.openSnags || 0}</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Projects Across Key Execution Pipeline Stages</h3>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 12 Control Gates Overview */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck style={{ color: '#2563eb', width: '20px', height: '20px' }} />
              12 Non-Negotiable Control Gates
            </h3>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setActiveTab('stages')}>
              View Stages &rarr;
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {CONTROL_GATES.map((gate, i) => (
              <div key={i} style={{ padding: '8px 12px', background: 'var(--border-subtle)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#10b981', flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Jobs Quick List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', margin: 0 }}>Recent Customer Jobs Master</h3>
          <button className="btn btn-primary" onClick={() => setActiveTab('jobs')}>View All Jobs</button>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Job No.</th>
                <th>Customer / Company</th>
                <th>Project Type</th>
                <th>Contract Value</th>
                <th>Current Stage</th>
                <th>% Complete</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 5).map((job) => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{job.id}</td>
                  <td>{job.company}</td>
                  <td>{job.proj_type}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(job.contract_value)}</td>
                  <td><span className="badge badge-info">{job.current_stage || '01 Enquiry'}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${job.pct_complete || 0}%`, height: '100%', background: 'var(--accent-primary)' }}></div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>{job.pct_complete || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${job.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
