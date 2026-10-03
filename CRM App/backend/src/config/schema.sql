-- VUDFIT CRM App PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(50) PRIMARY KEY, -- Job No (e.g. VDF-2026-0001)
    company VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    location TEXT,
    architect VARCHAR(255),
    sales_owner VARCHAR(255),
    proj_type VARCHAR(100) DEFAULT 'Modular Kitchen',
    order_date DATE,
    contract_value NUMERIC(12, 2) DEFAULT 0,
    current_stage VARCHAR(100) DEFAULT '01 Enquiry Received',
    pct_complete INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active', -- Active, On Hold, Cancelled, Completed
    target_completion DATE,
    actual_completion DATE,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    priority VARCHAR(50) DEFAULT 'Medium',
    remarks TEXT,
    -- External System Integration Readiness Placeholders (Unbound until verified)
    external_quotation_id VARCHAR(100),
    external_po_ids TEXT,
    external_inventory_ref VARCHAR(100),
    sync_status VARCHAR(50) DEFAULT 'UNLINKED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    lead_date DATE DEFAULT CURRENT_DATE,
    company VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    location TEXT,
    source VARCHAR(100) DEFAULT 'Walk-in',
    assigned_to VARCHAR(255),
    requirement VARCHAR(255),
    stage VARCHAR(50) DEFAULT 'New', -- New, Contacted, Qualified, Quotation Pending, Won, Lost
    next_action TEXT,
    next_action_date DATE,
    est_value NUMERIC(12, 2) DEFAULT 0,
    probability INT DEFAULT 50,
    remarks TEXT,
    external_quotation_ref VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_stages (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE CASCADE,
    stage_no INT NOT NULL,
    stage VARCHAR(150) NOT NULL,
    owner VARCHAR(255),
    planned_start DATE,
    planned_finish DATE,
    actual_start DATE,
    actual_finish DATE,
    status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Completed, Blocked
    pct INT DEFAULT 0,
    days_late INT DEFAULT 0,
    approval VARCHAR(20) DEFAULT 'No', -- Yes, No, NA
    approval_status VARCHAR(50) DEFAULT '', -- Pending, Approved, Rejected
    remarks TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, stage_no)
);

CREATE TABLE IF NOT EXISTS job_checklists (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE CASCADE,
    category VARCHAR(150) NOT NULL,
    item TEXT NOT NULL,
    required VARCHAR(10) DEFAULT 'Yes',
    responsible VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Completed, N/A
    due_date DATE,
    completed_date DATE,
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE CASCADE,
    invoice_no VARCHAR(100),
    invoice_date DATE,
    description TEXT,
    invoice_amt NUMERIC(12, 2) DEFAULT 0,
    received NUMERIC(12, 2) DEFAULT 0,
    receipt_date DATE,
    method VARCHAR(50) DEFAULT 'Bank Transfer',
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Partial, Paid, Overdue
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    spec TEXT,
    supplier VARCHAR(255),
    req_qty NUMERIC(10, 2) DEFAULT 0,
    ord_qty NUMERIC(10, 2) DEFAULT 0,
    rec_qty NUMERIC(10, 2) DEFAULT 0,
    order_date DATE,
    expected_date DATE,
    received_date DATE,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Ordered, Partially Received, Received, Delayed
    external_po_ref VARCHAR(100),
    external_inventory_item_code VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_tasks (
    id SERIAL PRIMARY KEY,
    task_date DATE DEFAULT CURRENT_DATE,
    job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE SET NULL,
    dept VARCHAR(100) NOT NULL, -- Sales, Design, Commercial, Procurement, Production, Dispatch, Installation, Service, Accounts
    task TEXT NOT NULL,
    owner VARCHAR(255),
    priority VARCHAR(50) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Completed, Blocked
    planned_date DATE,
    due_date DATE,
    pct INT DEFAULT 0,
    blocker TEXT,
    next_action TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS snags (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE CASCADE,
    area VARCHAR(255),
    description TEXT NOT NULL,
    raised_date DATE DEFAULT CURRENT_DATE,
    assigned_to VARCHAR(255),
    target_date DATE,
    status VARCHAR(50) DEFAULT 'Open', -- Open, In Progress, Closed
    closed_date DATE,
    verified VARCHAR(10) DEFAULT 'No',
    root_cause TEXT,
    action_taken TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS handovers (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
    handover_date DATE,
    contact VARCHAR(255),
    completion_pct INT DEFAULT 100,
    accepted VARCHAR(10) DEFAULT 'No',
    final_payment VARCHAR(50) DEFAULT 'Pending',
    warranty VARCHAR(10) DEFAULT 'No',
    feedback_date DATE,
    feedback TEXT,
    design_rating INT DEFAULT 5,
    finish_rating INT DEFAULT 5,
    install_rating INT DEFAULT 5,
    comm_rating INT DEFAULT 5,
    refer VARCHAR(10) DEFAULT 'Yes',
    testimonial VARCHAR(10) DEFAULT 'Yes',
    future_req TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profitability (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
    material_cost NUMERIC(12, 2) DEFAULT 0,
    hardware_cost NUMERIC(12, 2) DEFAULT 0,
    labour_cost NUMERIC(12, 2) DEFAULT 0,
    machine_cost NUMERIC(12, 2) DEFAULT 0,
    finish_cost NUMERIC(12, 2) DEFAULT 0,
    transport NUMERIC(12, 2) DEFAULT 0,
    installation NUMERIC(12, 2) DEFAULT 0,
    other_cost NUMERIC(12, 2) DEFAULT 0,
    remarks TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration Audit Event Log for Cross-System Synchronization Traceability
CREATE TABLE IF NOT EXISTS integration_audit_log (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    source_system VARCHAR(100) DEFAULT 'CRM',
    target_system VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- PENDING, SUCCESS, FAILED, RETRYING
    payload TEXT,
    error_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
