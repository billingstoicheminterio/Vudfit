import React, { useEffect, useState } from 'react';
import { getJobs, getPayments, createPayment, deletePayment } from '../services/api';
import { Plus, Trash2, X, CreditCard } from 'lucide-react';

export default function Payments() {
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    job_id: '',
    invoice_no: '',
    invoice_date: '',
    description: '',
    invoice_amt: '',
    received: '',
    receipt_date: '',
    method: 'Bank Transfer',
    due_date: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, payRes] = await Promise.all([getJobs(), getPayments()]);
      setJobs(jobsRes.data);
      setPayments(payRes.data);
      if (jobsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, job_id: jobsRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      job_id: jobs.length > 0 ? jobs[0].id : '',
      invoice_no: `INV-2026-${String(payments.length + 1).padStart(3, '0')}`,
      invoice_date: new Date().toISOString().slice(0, 10),
      description: 'Advance Payment',
      invoice_amt: '',
      received: '',
      receipt_date: '',
      method: 'Bank Transfer',
      due_date: '',
      status: 'Pending'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPayment(formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Error creating payment record: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this payment record?')) {
      try {
        await deletePayment(id);
        fetchData();
      } catch (err) {
        alert('Error deleting payment: ' + err.message);
      }
    }
  };

  const fmt = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', margin: 0 }}>Customer Invoices & Payment Ledger</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Track billing, payment receipts, method, and outstanding balances.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>+ Record Invoice / Payment</span>
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Job No.</th>
              <th>Invoice No.</th>
              <th>Invoice Date</th>
              <th>Description</th>
              <th>Invoice Amt (₹)</th>
              <th>Amount Received (₹)</th>
              <th>Outstanding (₹)</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>Loading Payments...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No payment records found. Click "+ Record Invoice / Payment" to add one.</td></tr>
            ) : (
              payments.map((p) => {
                const inv = Number(p.invoice_amt) || 0;
                const rec = Number(p.received) || 0;
                const outstanding = inv - rec;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{p.job_id}</td>
                    <td style={{ fontWeight: 600 }}>{p.invoice_no}</td>
                    <td>{p.invoice_date ? p.invoice_date.slice(0, 10) : '—'}</td>
                    <td>{p.description}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(inv)}</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{fmt(rec)}</td>
                    <td style={{ fontWeight: 700, color: outstanding > 0 ? '#ef4444' : 'var(--text-muted)' }}>{fmt(outstanding)}</td>
                    <td><span className="badge badge-neutral">{p.method}</span></td>
                    <td>
                      <span className={`badge ${p.status === 'Paid' ? 'badge-success' : p.status === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(p.id)}>
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Record New Invoice / Payment</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Job No. *</label>
                  <select value={formData.job_id} onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.id} — {j.company}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Invoice No. *</label>
                  <input type="text" required value={formData.invoice_no} onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Invoice Date</label>
                  <input type="date" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Payment Method</label>
                  <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })}>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Description / Stage Milestone</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Booking Advance 40% / Dispatch Balance" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Invoice Amount (₹) *</label>
                  <input type="number" required value={formData.invoice_amt} onChange={(e) => setFormData({ ...formData, invoice_amt: e.target.value })} placeholder="500000" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Amount Received (₹)</label>
                  <input type="number" value={formData.received} onChange={(e) => setFormData({ ...formData, received: e.target.value })} placeholder="500000" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Payment Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Due Date</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
