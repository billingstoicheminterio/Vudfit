import React, { useEffect, useState } from 'react';
import { getJobs, getJobChecklists, updateChecklistItem } from '../services/api';
import { CheckSquare, Filter } from 'lucide-react';

export default function Checklists() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) fetchChecklists(selectedJobId);
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const res = await getJobs();
      setJobs(res.data);
      if (res.data.length > 0) setSelectedJobId(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChecklists = async (jobId) => {
    try {
      setLoading(true);
      const res = await getJobChecklists(jobId);
      setChecklists(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = async (id, field, val) => {
    const updated = checklists.map(c => c.id === id ? { ...c, [field]: val } : c);
    setChecklists(updated);
    const targetItem = updated.find(c => c.id === id);

    try {
      await updateChecklistItem(id, targetItem);
    } catch (err) {
      console.error('Failed to update checklist item:', err);
    }
  };

  const categories = ['All', ...new Set(checklists.map(c => c.category))];

  const filteredItems = selectedCategory === 'All'
    ? checklists
    : checklists.filter(c => c.category === selectedCategory);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Selection Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: 700, fontSize: '14px' }}>Select Customer Job:</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            style={{ width: 'auto', minWidth: '240px', fontWeight: 600 }}
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.id} — {j.company}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Filter style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Filter Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Checklist Item</th>
              <th>Responsible Person</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Completed Date</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>Loading Master Checklists...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No checklist items found.</td></tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td><span className="badge badge-neutral">{item.category}</span></td>
                  <td style={{ fontWeight: 600 }}>{item.item}</td>
                  <td>
                    <input
                      type="text"
                      value={item.responsible || ''}
                      placeholder="Responsible..."
                      onChange={(e) => handleItemChange(item.id, 'responsible', e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    />
                  </td>
                  <td>
                    <select
                      value={item.status || 'Not Started'}
                      onChange={(e) => handleItemChange(item.id, 'status', e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: item.status === 'Completed' ? '#10b981' : item.status === 'In Progress' ? '#2563eb' : 'var(--text-muted)'
                      }}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="date"
                      value={item.due_date ? item.due_date.slice(0, 10) : ''}
                      onChange={(e) => handleItemChange(item.id, 'due_date', e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={item.completed_date ? item.completed_date.slice(0, 10) : ''}
                      onChange={(e) => handleItemChange(item.id, 'completed_date', e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.remarks || ''}
                      placeholder="Remarks..."
                      onChange={(e) => handleItemChange(item.id, 'remarks', e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
