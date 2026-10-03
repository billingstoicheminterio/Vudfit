const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const MASTER_STAGES = [
  "01 Enquiry Received", "02 Lead Qualification", "03 Showroom / Experience Centre Visit",
  "04 Site Visit & Measurement", "05 Design Brief", "06 Pytha / CAD Design",
  "07 Client Presentation & Revision", "08 Final Design Approval", "09 BOQ / Costing",
  "10 Margin Check", "11 Final Quotation", "12 Negotiation / Revision",
  "13 Material & Hardware Selection", "14 Order Confirmation", "15 Advance / Payment Confirmation",
  "16 Order Release", "17 Production Drawings / Pytha Finalization", "18 Cutlist / Nesting / Machine Files",
  "19 Material Issue", "20 Machine Production", "21 PU / Special Finishing",
  "22 Production QC", "23 Rework / QC Recheck if Required", "24 Assembly",
  "25 Final QC", "26 Packing & Identification", "27 Dispatch Readiness",
  "28 Site Readiness Confirmation", "29 Dispatch", "30 Site Receipt",
  "31 Installation", "32 Installation QC", "33 Snagging & Rectification",
  "34 Final Handover", "35 Final Invoice / Balance Payment", "36 Warranty / After-Sales",
  "37 Client Review / Feedback", "38 Referral / Repeat Opportunity", "39 Project Closure"
];

const MASTER_CHECKLISTS = {
  "Qualification": ["Enquiry source recorded", "Customer/company and contact details recorded", "Project location confirmed", "Requirement and categories understood", "Budget range discussed", "Decision maker identified", "Architect / designer identified", "Expected completion timeline confirmed", "Lead qualified", "Next action and date recorded"],
  "Showroom / Experience Centre": ["Visit scheduled and confirmed", "Requirements discussed", "Categories finalized / shortlisted", "Materials and finishes discussed", "Hardware preferences discussed", "Budget / scope aligned", "Follow-up action recorded"],
  "Site Measurement": ["Site address and site contact verified", "Room dimensions recorded", "Floor-to-ceiling height recorded", "Beam / column / niche locations recorded", "Doors / windows / skirting checked", "Electrical points recorded", "Plumbing / drainage recorded", "Gas / appliance points recorded where applicable", "Ceiling / false ceiling checked", "Access / lift / staircase / unloading checked", "Site photographs captured", "Measurements verified"],
  "Design & Approval": ["Design brief prepared", "Pytha / CAD design created", "Internal layouts checked", "Dimensions cross-checked with measurement", "Material / finish specified", "Hardware specified", "Client presentation completed", "Revision number assigned", "Client approval received", "Final approved drawing frozen"],
  "BOQ / Costing / Quotation": ["BOQ prepared", "Board/material quantities calculated", "Hardware quantities calculated", "Labour and machine costs considered", "PU / special finishing cost considered", "Transport and installation considered", "Wastage and overheads considered", "Margin checked", "Internal quotation approval completed", "Quotation sent", "Negotiations / revisions recorded", "Final commercial terms confirmed"],
  "Order Release": ["Customer order confirmation received", "Advance / approved credit condition confirmed", "Final design approval available", "Measurement available", "Material selections frozen", "Hardware selections frozen", "Procurement requirements identified", "Production target date assigned", "Production release authorized"],
  "Procurement": ["Material availability checked", "Purchase requirements created", "Supplier PO/order placed", "Expected receipt dates recorded", "Received quantity checked", "Received quality checked", "Shortage / damage / replacement recorded", "Material issued against Job No."],
  "Production": ["Production drawings finalized", "Cutlist / part list generated", "Nesting / machine files generated", "Labels / identification prepared", "Material issued", "Machine cutting completed", "CNC / drilling completed", "Edge banding completed", "PU / special finishing completed where applicable", "Production QC passed", "Rework closed and rechecked if required", "Assembly completed", "Final QC passed", "Packed and identified"],
  "Dispatch & Site Readiness": ["All production items ready", "Hardware / accessories packed", "Installation drawings available", "Dispatch quantity checked", "Site readiness confirmed", "Civil / flooring / painting status checked", "Electrical / plumbing readiness checked", "Access / lift / unloading confirmed", "Transport arranged", "Payment / dispatch condition cleared"],
  "Installation": ["Site received material and checked quantity", "Installation team briefed", "Latest approved drawings available", "Installation tracked area-by-area", "Alignment / level / gaps checked", "Hardware operation checked", "Finish / scratches / damage checked", "Electrical / plumbing coordination checked", "Installation QC completed"],
  "Snagging & Rectification": ["Snag list created", "Every snag assigned to an owner", "Target date assigned", "Material / replacement requirements recorded", "Rectification completed", "Reinspection completed", "Client verification received", "All snags closed"],
  "Handover & Financial Closure": ["Installation completed", "Final QC completed", "Handover completed", "Warranty terms explained", "Final invoice raised", "Balance payment received / approved", "Required documents handed over"],
  "Final Feedback & After-Sales": ["Feedback requested", "Feedback recorded", "Design feedback captured", "Finish feedback captured", "Installation feedback captured", "Communication feedback captured", "Service / warranty contact explained", "Testimonial permission requested where appropriate", "Photography permission requested where appropriate", "Future requirement recorded", "Referral opportunity recorded", "Project formally closed"]
};

// PostgreSQL configuration
const pgConfig = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'vudfit_crm',
  password: process.env.PGPASSWORD || 'postgres',
  port: parseInt(process.env.PGPORT || '5432', 10),
  connectionTimeoutMillis: 3000,
};

let pool = new Pool(pgConfig);
let isPgConnected = false;

// Local JSON Storage fallback if Postgres is offline
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function getLocalFile(name) { return path.join(DATA_DIR, `${name}.json`); }
function readLocalData(name) {
  const p = getLocalFile(name);
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) { return []; }
}
function writeLocalData(name, data) {
  fs.writeFileSync(getLocalFile(name), JSON.stringify(data, null, 2));
}

// Initializer function
async function initDb() {
  try {
    const client = await pool.connect();
    client.release();
    isPgConnected = true;
    console.log('✅ Connected to PostgreSQL Database:', pgConfig.database);

    // Run schema setup
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('✅ PostgreSQL Schema tables initialized.');
    }
    await seedDemoDataIfEmpty();
  } catch (err) {
    isPgConnected = false;
    console.warn('⚠️  PostgreSQL connection unavailable (Using local persistent storage handler):', err.message);
    initLocalSeedData();
  }
}

async function seedDemoDataIfEmpty() {
  if (!isPgConnected) return;
  const res = await pool.query('SELECT COUNT(*) FROM jobs');
  if (parseInt(res.rows[0].count, 10) === 0) {
    console.log('🌱 Seeding initial demo job & lead records into PostgreSQL...');
    
    // Seed Job
    const jobId = 'VDF-2026-0001';
    await pool.query(`
      INSERT INTO jobs (id, company, contact, phone, email, location, architect, sales_owner, proj_type, order_date, contract_value, current_stage, pct_complete, status, target_completion, payment_status, priority, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [jobId, 'Oberoi Luxury Villa', 'Rajesh Sharma', '+91 9876543210', 'rajesh@oberoi.com', 'Worli, Mumbai', 'Architect Mehta', 'Sanjay Kumar', 'Modular Kitchen', '2026-09-01', 1250000.00, '14 Order Confirmation', 35, 'Active', '2026-11-15', 'Partial', 'High', 'Premium Acrylic & Veneer Finish']);

    // Seed stages for job
    for (let i = 0; i < MASTER_STAGES.length; i++) {
      const st = MASTER_STAGES[i];
      const status = i < 14 ? 'Completed' : (i === 14 ? 'In Progress' : 'Not Started');
      const pct = i < 14 ? 100 : (i === 14 ? 40 : 0);
      await pool.query(`
        INSERT INTO job_stages (job_id, stage_no, stage, owner, status, pct)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [jobId, i + 1, st, 'Design Team', status, pct]);
    }

    // Seed checklists for job
    for (const cat of Object.keys(MASTER_CHECKLISTS)) {
      for (const item of MASTER_CHECKLISTS[cat]) {
        await pool.query(`
          INSERT INTO job_checklists (job_id, category, item, required, status)
          VALUES ($1, $2, $3, $4, $5)
        `, [jobId, cat, item, 'Yes', 'Not Started']);
      }
    }

    // Seed Lead
    await pool.query(`
      INSERT INTO leads (company, contact, phone, email, location, source, assigned_to, requirement, stage, est_value, probability, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, ['Apex Commercial Tower', 'Priya Malhotra', '+91 9988776655', 'priya@apex.in', 'Bandra West, Mumbai', 'Architect', 'Anjali Gupta', 'Full Penthouse Wardrobes & Kitchen', 'Qualified', 2800000, 70, 'Site visit scheduled for next Tuesday']);

    // Seed Payment
    await pool.query(`
      INSERT INTO payments (job_id, invoice_no, invoice_date, description, invoice_amt, received, receipt_date, method, due_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [jobId, 'INV-2026-001', '2026-09-05', 'Booking Advance (40%)', 500000, 500000, '2026-09-06', 'Bank Transfer', '2026-09-05', 'Paid']);

    // Seed Material
    await pool.query(`
      INSERT INTO materials (job_id, item, spec, supplier, req_qty, ord_qty, rec_qty, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [jobId, 'HDHMR 18mm Board', 'Action TESA Waterproof', 'National Hardware', 45, 45, 45, 'Received']);

    // Seed Daily Task
    await pool.query(`
      INSERT INTO daily_tasks (job_id, dept, task, owner, priority, status, pct)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [jobId, 'Production', 'Finalize CNC Nesting & Cutlist', 'Vikram Singh', 'High', 'In Progress', 60]);

    // Seed Profitability
    await pool.query(`
      INSERT INTO profitability (job_id, material_cost, hardware_cost, labour_cost, machine_cost, finish_cost, transport, installation, other_cost, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [jobId, 420000, 180000, 85000, 45000, 65000, 25000, 50000, 15000, 'BOQ Cost Estimate Approved']);
  }
}

function initLocalSeedData() {
  let jobs = readLocalData('jobs');
  if (jobs.length === 0) {
    const jobId = 'VDF-2026-0001';
    jobs = [{
      id: jobId,
      company: 'Oberoi Luxury Villa',
      contact: 'Rajesh Sharma',
      phone: '+91 9876543210',
      email: 'rajesh@oberoi.com',
      location: 'Worli, Mumbai',
      architect: 'Architect Mehta',
      sales_owner: 'Sanjay Kumar',
      proj_type: 'Modular Kitchen',
      order_date: '2026-09-01',
      contract_value: 1250000,
      current_stage: '14 Order Confirmation',
      pct_complete: 35,
      status: 'Active',
      target_completion: '2026-11-15',
      payment_status: 'Partial',
      priority: 'High',
      remarks: 'Premium Acrylic & Veneer Finish'
    }];
    writeLocalData('jobs', jobs);

    const stages = MASTER_STAGES.map((st, i) => ({
      id: i + 1,
      job_id: jobId,
      stage_no: i + 1,
      stage: st,
      owner: 'Design Team',
      status: i < 14 ? 'Completed' : (i === 14 ? 'In Progress' : 'Not Started'),
      pct: i < 14 ? 100 : (i === 14 ? 40 : 0),
      days_late: 0,
      approval: 'No',
      approval_status: '',
      remarks: ''
    }));
    writeLocalData('job_stages', stages);

    let ckList = [];
    let ckId = 1;
    for (const cat of Object.keys(MASTER_CHECKLISTS)) {
      for (const item of MASTER_CHECKLISTS[cat]) {
        ckList.push({
          id: ckId++,
          job_id: jobId,
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
    writeLocalData('job_checklists', ckList);

    writeLocalData('leads', [{
      id: 1,
      lead_date: '2026-09-25',
      company: 'Apex Commercial Tower',
      contact: 'Priya Malhotra',
      phone: '+91 9988776655',
      email: 'priya@apex.in',
      location: 'Bandra West, Mumbai',
      source: 'Architect',
      assigned_to: 'Anjali Gupta',
      requirement: 'Full Penthouse Wardrobes & Kitchen',
      stage: 'Qualified',
      est_value: 2800000,
      probability: 70,
      remarks: 'Site visit scheduled for next Tuesday'
    }]);

    writeLocalData('payments', [{
      id: 1,
      job_id: jobId,
      invoice_no: 'INV-2026-001',
      invoice_date: '2026-09-05',
      description: 'Booking Advance (40%)',
      invoice_amt: 500000,
      received: 500000,
      receipt_date: '2026-09-06',
      method: 'Bank Transfer',
      due_date: '2026-09-05',
      status: 'Paid'
    }]);

    writeLocalData('materials', [{
      id: 1,
      job_id: jobId,
      item: 'HDHMR 18mm Board',
      spec: 'Action TESA Waterproof',
      supplier: 'National Hardware',
      req_qty: 45,
      ord_qty: 45,
      rec_qty: 45,
      status: 'Received'
    }]);

    writeLocalData('daily_tasks', [{
      id: 1,
      task_date: '2026-09-27',
      job_id: jobId,
      dept: 'Production',
      task: 'Finalize CNC Nesting & Cutlist',
      owner: 'Vikram Singh',
      priority: 'High',
      status: 'In Progress',
      pct: 60
    }]);

    writeLocalData('profitability', [{
      id: 1,
      job_id: jobId,
      material_cost: 420000,
      hardware_cost: 180000,
      labour_cost: 85000,
      machine_cost: 45000,
      finish_cost: 65000,
      transport: 25000,
      installation: 50000,
      other_cost: 15000,
      remarks: 'BOQ Cost Estimate Approved'
    }]);
  }
}

module.exports = {
  pool,
  getIsPgConnected: () => isPgConnected,
  initDb,
  readLocalData,
  writeLocalData,
  MASTER_STAGES,
  MASTER_CHECKLISTS
};
