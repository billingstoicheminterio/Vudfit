const express = require('express');
const router = express.Router();
const {
  pool,
  getIsPgConnected,
  readLocalData,
  writeLocalData,
  MASTER_STAGES,
  MASTER_CHECKLISTS
} = require('../config/db');

// Allowed Column Whitelists for SQL Injection Protection
const ALLOWED_COLUMNS = {
  jobs: ['company', 'contact', 'phone', 'email', 'location', 'architect', 'sales_owner', 'proj_type', 'order_date', 'contract_value', 'current_stage', 'pct_complete', 'status', 'target_completion', 'actual_completion', 'payment_status', 'priority', 'remarks', 'external_quotation_id', 'external_po_ids', 'external_inventory_ref', 'sync_status'],
  leads: ['lead_date', 'company', 'contact', 'phone', 'email', 'location', 'source', 'assigned_to', 'requirement', 'stage', 'next_action', 'next_action_date', 'est_value', 'probability', 'remarks', 'external_quotation_ref'],
  payments: ['job_id', 'invoice_no', 'invoice_date', 'description', 'invoice_amt', 'received', 'receipt_date', 'method', 'due_date', 'status', 'remarks'],
  materials: ['job_id', 'item', 'spec', 'supplier', 'req_qty', 'ord_qty', 'rec_qty', 'order_date', 'expected_date', 'received_date', 'status', 'external_po_ref', 'external_inventory_item_code', 'remarks'],
  daily_tasks: ['task_date', 'job_id', 'dept', 'task', 'owner', 'priority', 'status', 'planned_date', 'due_date', 'pct', 'blocker', 'next_action', 'remarks'],
  snags: ['job_id', 'area', 'description', 'raised_date', 'assigned_to', 'target_date', 'status', 'closed_date', 'verified', 'root_cause', 'action_taken', 'remarks'],
  handovers: ['job_id', 'handover_date', 'contact', 'completion_pct', 'accepted', 'final_payment', 'warranty', 'feedback_date', 'feedback', 'design_rating', 'finish_rating', 'install_rating', 'comm_rating', 'refer', 'testimonial', 'future_req', 'remarks'],
  profitability: ['job_id', 'material_cost', 'hardware_cost', 'labour_cost', 'machine_cost', 'finish_cost', 'transport', 'installation', 'other_cost', 'remarks']
};

// Helper for Auto Job ID Generation
async function generateJobId() {
  if (getIsPgConnected()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query("SELECT id FROM jobs WHERE id LIKE 'VDF-2026-%' ORDER BY id DESC LIMIT 1 FOR UPDATE");
      await client.query('COMMIT');
      if (res.rows.length === 0) return 'VDF-2026-0001';
      const lastNum = parseInt(res.rows[0].id.replace('VDF-2026-', ''), 10);
      return `VDF-2026-${String(lastNum + 1).padStart(4, '0')}`;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } else {
    const jobs = readLocalData('jobs');
    let max = 0;
    jobs.forEach(j => {
      const num = parseInt(String(j.id).replace('VDF-2026-', ''), 10);
      if (!isNaN(num) && num > max) max = num;
    });
    return `VDF-2026-${String(max + 1).padStart(4, '0')}`;
  }
}

// ---------------- DASHBOARD STATS ----------------
router.get('/dashboard/stats', async (req, res) => {
  try {
    if (getIsPgConnected()) {
      const jobsRes = await pool.query('SELECT * FROM jobs');
      const leadsRes = await pool.query('SELECT * FROM leads');
      const paymentsRes = await pool.query('SELECT * FROM payments');
      const snagsRes = await pool.query('SELECT * FROM snags');

      const jobs = jobsRes.rows;
      const leads = leadsRes.rows;
      const payments = paymentsRes.rows;
      const snags = snagsRes.rows;

      const totalRevenue = jobs.reduce((sum, j) => sum + (parseFloat(j.contract_value) || 0), 0);
      const totalCollected = payments.reduce((sum, p) => sum + (parseFloat(p.received) || 0), 0);

      res.json({
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'Active').length,
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.stage === 'New').length,
        totalRevenue,
        totalCollected,
        outstandingAmount: totalRevenue - totalCollected,
        openSnags: snags.filter(s => s.status !== 'Closed').length,
        isPgConnected: true
      });
    } else {
      const jobs = readLocalData('jobs');
      const leads = readLocalData('leads');
      const payments = readLocalData('payments');
      const snags = readLocalData('snags');

      const totalRevenue = jobs.reduce((sum, j) => sum + (parseFloat(j.contract_value) || 0), 0);
      const totalCollected = payments.reduce((sum, p) => sum + (parseFloat(p.received) || 0), 0);

      res.json({
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'Active').length,
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.stage === 'New').length,
        totalRevenue,
        totalCollected,
        outstandingAmount: totalRevenue - totalCollected,
        openSnags: snags.filter(s => s.status !== 'Closed').length,
        isPgConnected: false
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- JOBS API ----------------
router.get('/jobs', async (req, res) => {
  try {
    if (getIsPgConnected()) {
      const result = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
      res.json(result.rows);
    } else {
      res.json(readLocalData('jobs'));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs', async (req, res) => {
  try {
    const jobId = await generateJobId();
    const data = {
      id: jobId,
      company: req.body.company || 'New Customer',
      contact: req.body.contact || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      location: req.body.location || '',
      architect: req.body.architect || '',
      sales_owner: req.body.sales_owner || '',
      proj_type: req.body.proj_type || 'Modular Kitchen',
      order_date: req.body.order_date || new Date().toISOString().slice(0, 10),
      contract_value: parseFloat(req.body.contract_value) || 0,
      current_stage: '01 Enquiry Received',
      pct_complete: 0,
      status: 'Active',
      target_completion: req.body.target_completion || null,
      payment_status: 'Pending',
      priority: req.body.priority || 'Medium',
      remarks: req.body.remarks || '',
      external_quotation_id: req.body.external_quotation_id || null,
      external_po_ids: req.body.external_po_ids || null,
      external_inventory_ref: req.body.external_inventory_ref || null,
      sync_status: req.body.external_quotation_id ? 'LINKED_QUOTATION' : 'UNLINKED'
    };

    if (getIsPgConnected()) {
      await pool.query(`
        INSERT INTO jobs (id, company, contact, phone, email, location, architect, sales_owner, proj_type, order_date, contract_value, current_stage, pct_complete, status, target_completion, payment_status, priority, remarks, external_quotation_id, external_po_ids, external_inventory_ref, sync_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `, [data.id, data.company, data.contact, data.phone, data.email, data.location, data.architect, data.sales_owner, data.proj_type, data.order_date, data.contract_value, data.current_stage, data.pct_complete, data.status, data.target_completion, data.payment_status, data.priority, data.remarks, data.external_quotation_id, data.external_po_ids, data.external_inventory_ref, data.sync_status]);

      for (let i = 0; i < MASTER_STAGES.length; i++) {
        await pool.query(`
          INSERT INTO job_stages (job_id, stage_no, stage, owner, status, pct)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [data.id, i + 1, MASTER_STAGES[i], 'Design Team', 'Not Started', 0]);
      }

      for (const cat of Object.keys(MASTER_CHECKLISTS)) {
        for (const item of MASTER_CHECKLISTS[cat]) {
          await pool.query(`
            INSERT INTO job_checklists (job_id, category, item, required, status)
            VALUES ($1, $2, $3, $4, $5)
          `, [data.id, cat, item, 'Yes', 'Not Started']);
        }
      }

      res.status(201).json(data);
    } else {
      const jobs = readLocalData('jobs');
      jobs.unshift(data);
      writeLocalData('jobs', jobs);

      const localStages = readLocalData('job_stages');
      MASTER_STAGES.forEach((st, i) => {
        localStages.push({
          id: Date.now() + i,
          job_id: data.id,
          stage_no: i + 1,
          stage: st,
          owner: 'Design Team',
          status: 'Not Started',
          pct: 0,
          days_late: 0,
          approval: 'No',
          approval_status: '',
          remarks: ''
        });
      });
      writeLocalData('job_stages', localStages);

      const localChecklists = readLocalData('job_checklists');
      let ckId = Date.now();
      for (const cat of Object.keys(MASTER_CHECKLISTS)) {
        for (const item of MASTER_CHECKLISTS[cat]) {
          localChecklists.push({
            id: ckId++,
            job_id: data.id,
            category: cat,
            item: item,
            required: 'Yes',
            responsible: '',
            status: 'Not Started',
            due_date: '',
            completed_date: '',
            remarks: ''
          });
        }
      }
      writeLocalData('job_checklists', localChecklists);

      res.status(201).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ALLOWED_COLUMNS.jobs;
    if (getIsPgConnected()) {
      const updates = [];
      const values = [];
      let idx = 1;

      allowed.forEach(f => {
        if (req.body[f] !== undefined) {
          updates.push(`${f} = $${idx++}`);
          values.push(req.body[f]);
        }
      });
      values.push(id);

      if (updates.length > 0) {
        await pool.query(`UPDATE jobs SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx}`, values);
      }
      res.json({ message: 'Job updated successfully' });
    } else {
      let jobs = readLocalData('jobs');
      const idx = jobs.findIndex(j => j.id === id);
      if (idx !== -1) {
        allowed.forEach(f => {
          if (req.body[f] !== undefined) jobs[idx][f] = req.body[f];
        });
        writeLocalData('jobs', jobs);
        res.json(jobs[idx]);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsPgConnected()) {
      await pool.query('DELETE FROM jobs WHERE id = $1', [id]);
      res.json({ message: 'Job deleted' });
    } else {
      let jobs = readLocalData('jobs').filter(j => j.id !== id);
      writeLocalData('jobs', jobs);
      let stages = readLocalData('job_stages').filter(s => s.job_id !== id);
      writeLocalData('job_stages', stages);
      let checklists = readLocalData('job_checklists').filter(c => c.job_id !== id);
      writeLocalData('job_checklists', checklists);
      res.json({ message: 'Job deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- STAGE TRACKER API ----------------
router.get('/stages/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    if (getIsPgConnected()) {
      const result = await pool.query('SELECT * FROM job_stages WHERE job_id = $1 ORDER BY stage_no ASC', [jobId]);
      res.json(result.rows);
    } else {
      const stages = readLocalData('job_stages').filter(s => s.job_id === jobId);
      res.json(stages);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/stages/:jobId/stage/:stageNo', async (req, res) => {
  try {
    const { jobId, stageNo } = req.params;
    const { owner, planned_start, planned_finish, actual_start, actual_finish, status, pct, approval, approval_status, remarks } = req.body;

    if (getIsPgConnected()) {
      await pool.query(`
        UPDATE job_stages
        SET owner = COALESCE($1, owner),
            planned_start = $2,
            planned_finish = $3,
            actual_start = $4,
            actual_finish = $5,
            status = COALESCE($6, status),
            pct = COALESCE($7, pct),
            approval = COALESCE($8, approval),
            approval_status = COALESCE($9, approval_status),
            remarks = COALESCE($10, remarks),
            updated_at = CURRENT_TIMESTAMP
        WHERE job_id = $11 AND stage_no = $12
      `, [owner, planned_start || null, planned_finish || null, actual_start || null, actual_finish || null, status, pct, approval, approval_status, remarks, jobId, stageNo]);

      const allStages = await pool.query('SELECT * FROM job_stages WHERE job_id = $1', [jobId]);
      const doneCount = allStages.rows.filter(s => s.status === 'Completed').length;
      const activeStage = allStages.rows.find(s => s.status !== 'Completed');
      const jobPct = Math.round((doneCount / allStages.rows.length) * 100);
      const currentStageStr = activeStage ? activeStage.stage : '40 Project Closure Complete';

      await pool.query('UPDATE jobs SET pct_complete = $1, current_stage = $2 WHERE id = $3', [jobPct, currentStageStr, jobId]);
      res.json({ message: 'Stage updated' });
    } else {
      let stages = readLocalData('job_stages');
      const idx = stages.findIndex(s => s.job_id === jobId && s.stage_no === parseInt(stageNo, 10));
      if (idx !== -1) {
        stages[idx] = { ...stages[idx], ...req.body };
        writeLocalData('job_stages', stages);

        const jobStages = stages.filter(s => s.job_id === jobId);
        const doneCount = jobStages.filter(s => s.status === 'Completed').length;
        const activeStage = jobStages.find(s => s.status !== 'Completed');
        const jobPct = Math.round((doneCount / jobStages.length) * 100);
        const currentStageStr = activeStage ? activeStage.stage : '40 Project Closure Complete';

        let jobs = readLocalData('jobs');
        const jIdx = jobs.findIndex(j => j.id === jobId);
        if (jIdx !== -1) {
          jobs[jIdx].pct_complete = jobPct;
          jobs[jIdx].current_stage = currentStageStr;
          writeLocalData('jobs', jobs);
        }
        res.json(stages[idx]);
      } else {
        res.status(404).json({ error: 'Stage not found' });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CHECKLISTS API ----------------
router.get('/checklists/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    if (getIsPgConnected()) {
      const result = await pool.query('SELECT * FROM job_checklists WHERE job_id = $1 ORDER BY id ASC', [jobId]);
      res.json(result.rows);
    } else {
      const checklists = readLocalData('job_checklists').filter(c => c.job_id === jobId);
      res.json(checklists);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/checklists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { responsible, status, due_date, completed_date, remarks } = req.body;
    if (getIsPgConnected()) {
      await pool.query(`
        UPDATE job_checklists
        SET responsible = $1, status = $2, due_date = $3, completed_date = $4, remarks = $5
        WHERE id = $6
      `, [responsible, status, due_date || null, completed_date || null, remarks, id]);
      res.json({ message: 'Checklist item updated' });
    } else {
      let checklists = readLocalData('job_checklists');
      const idx = checklists.findIndex(c => String(c.id) === String(id));
      if (idx !== -1) {
        checklists[idx] = { ...checklists[idx], ...req.body };
        writeLocalData('job_checklists', checklists);
        res.json(checklists[idx]);
      } else {
        res.status(404).json({ error: 'Checklist item not found' });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- LEADS API ----------------
router.get('/leads', async (req, res) => {
  try {
    if (getIsPgConnected()) {
      const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
      res.json(result.rows);
    } else {
      res.json(readLocalData('leads'));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/leads', async (req, res) => {
  try {
    const data = {
      lead_date: req.body.lead_date || new Date().toISOString().slice(0, 10),
      company: req.body.company || 'New Lead',
      contact: req.body.contact || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      location: req.body.location || '',
      source: req.body.source || 'Walk-in',
      assigned_to: req.body.assigned_to || '',
      requirement: req.body.requirement || '',
      stage: req.body.stage || 'New',
      next_action: req.body.next_action || '',
      next_action_date: req.body.next_action_date || null,
      est_value: parseFloat(req.body.est_value) || 0,
      probability: parseInt(req.body.probability, 10) || 50,
      remarks: req.body.remarks || '',
      external_quotation_ref: req.body.external_quotation_ref || null
    };

    if (getIsPgConnected()) {
      const result = await pool.query(`
        INSERT INTO leads (lead_date, company, contact, phone, email, location, source, assigned_to, requirement, stage, next_action, next_action_date, est_value, probability, remarks, external_quotation_ref)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [data.lead_date, data.company, data.contact, data.phone, data.email, data.location, data.source, data.assigned_to, data.requirement, data.stage, data.next_action, data.next_action_date, data.est_value, data.probability, data.remarks, data.external_quotation_ref]);
      res.status(201).json(result.rows[0]);
    } else {
      let leads = readLocalData('leads');
      data.id = Date.now();
      leads.unshift(data);
      writeLocalData('leads', leads);
      res.status(201).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ALLOWED_COLUMNS.leads;
    if (getIsPgConnected()) {
      const updates = [];
      const values = [];
      let idx = 1;
      allowed.forEach(f => {
        if (req.body[f] !== undefined) {
          updates.push(`${f} = $${idx++}`);
          values.push(req.body[f]);
        }
      });
      values.push(id);
      if (updates.length > 0) {
        await pool.query(`UPDATE leads SET ${updates.join(', ')} WHERE id = $${idx}`, values);
      }
      res.json({ message: 'Lead updated' });
    } else {
      let leads = readLocalData('leads');
      const idx = leads.findIndex(l => String(l.id) === String(id));
      if (idx !== -1) {
        allowed.forEach(f => {
          if (req.body[f] !== undefined) leads[idx][f] = req.body[f];
        });
        writeLocalData('leads', leads);
        res.json(leads[idx]);
      } else {
        res.status(404).json({ error: 'Lead not found' });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsPgConnected()) {
      await pool.query('DELETE FROM leads WHERE id = $1', [id]);
    } else {
      let leads = readLocalData('leads').filter(l => String(l.id) !== String(id));
      writeLocalData('leads', leads);
    }
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Secure Generic CRUD Route Builder with Whitelisted Columns
function buildCrudRoutes(pathName, tableName, localName) {
  const allowed = ALLOWED_COLUMNS[tableName] || [];

  router.get(`/${pathName}`, async (req, res) => {
    try {
      if (getIsPgConnected()) {
        const resDb = await pool.query(`SELECT * FROM ${tableName} ORDER BY id DESC`);
        res.json(resDb.rows);
      } else {
        res.json(readLocalData(localName));
      }
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.post(`/${pathName}`, async (req, res) => {
    try {
      const keys = Object.keys(req.body).filter(k => allowed.includes(k));
      if (keys.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

      if (getIsPgConnected()) {
        const vals = keys.map(k => req.body[k]);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const q = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const resDb = await pool.query(q, vals);
        res.status(201).json(resDb.rows[0]);
      } else {
        let items = readLocalData(localName);
        const item = { id: Date.now() };
        keys.forEach(k => item[k] = req.body[k]);
        items.unshift(item);
        writeLocalData(localName, items);
        res.status(201).json(item);
      }
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.put(`/${pathName}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const keys = Object.keys(req.body).filter(k => allowed.includes(k));
      if (keys.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

      if (getIsPgConnected()) {
        const updates = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const vals = [...keys.map(k => req.body[k]), id];
        await pool.query(`UPDATE ${tableName} SET ${updates} WHERE id = $${vals.length}`, vals);
        res.json({ message: 'Updated successfully' });
      } else {
        let items = readLocalData(localName);
        const idx = items.findIndex(i => String(i.id) === String(id));
        if (idx !== -1) {
          keys.forEach(k => items[idx][k] = req.body[k]);
          writeLocalData(localName, items);
          res.json(items[idx]);
        } else res.status(404).json({ error: 'Item not found' });
      }
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.delete(`/${pathName}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      if (getIsPgConnected()) {
        await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
      } else {
        let items = readLocalData(localName).filter(i => String(i.id) !== String(id));
        writeLocalData(localName, items);
      }
      res.json({ message: 'Deleted successfully' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}

buildCrudRoutes('payments', 'payments', 'payments');
buildCrudRoutes('materials', 'materials', 'materials');
buildCrudRoutes('daily-tasks', 'daily_tasks', 'daily_tasks');
buildCrudRoutes('snags', 'snags', 'snags');
buildCrudRoutes('handovers', 'handovers', 'handovers');
buildCrudRoutes('profitability', 'profitability', 'profitability');

// ---------------- INTEGRATION READINESS AUDIT STUBS ----------------
router.get('/integrations/status', (req, res) => {
  res.json({
    status: 'READY_FOR_INTEGRATION_AUDIT',
    systems: {
      crm: { status: 'ONLINE', database: getIsPgConnected() ? 'PostgreSQL' : 'JSON Engine', authoritative_for: ['Customer Record', 'Project Execution State', 'Checklists', 'Snags'] },
      quotation: { status: 'UNINSPECTED', authoritative_for: ['Quotation Versions', 'Unit Pricing'] },
      purchase_order: { status: 'UNINSPECTED', authoritative_for: ['Supplier POs', 'Vendor Terms'] },
      inventory: { status: 'UNINSPECTED', authoritative_for: ['Stock Balance', 'Material Masters'] }
    }
  });
});

module.exports = router;
