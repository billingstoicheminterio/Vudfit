# VUDFIT Systems Inventory (`SYSTEMS_INVENTORY.md`)

This document lists the technical inventory, verified status, dependencies, and uninspected variables across all four VUDFIT business applications.

---

## 1. CRM Application (`CRM App`)
- **Status**: **VERIFIED & AUDITED**
- **Location**: `e:\VUDFIT APPS\CRM App`
- **Frontend Stack**: React (Vite) + Lucide Icons + Recharts + CSS Design System
- **Backend Stack**: Node.js + Express REST API (`backend/src/server.js`)
- **Database**: Dual-engine: PostgreSQL (`vudfit_crm`) + Local JSON Fallback
- **Verified Capabilities**:
  - Customer & Lead lifecycle tracking
  - Auto Job ID generation (`VDF-2026-XXXX`) with atomic lock
  - 40 Master Execution Stages & 12 Non-Negotiable Control Gates
  - 13 Stage Checklists, Invoicing, Material Procurement, Daily Tasks, Snags, Handovers, Profitability
- **Security Audit Status**:
  - SQL injection mitigated via parameterization & column whitelisting
  - CORS enabled
  - Foreign Key cascade constraints enforced

---

## 2. Inventory Application (`modular-kitchen-inventory`)
- **Status**: **AVAILABLE IN WORKSPACE / UNCONNECTED**
- **Location**: `e:\VUDFIT APPS\modular-kitchen-inventory`
- **Frontend Stack**: React (Vite) + Javascript
- **Backend Stack**: Node.js / Express or Python API (standalone)
- **Database**: Local storage / SQLite / PostgreSQL
- **Key Responsibilities**:
  - Product catalog management (HDHMR boards, Blum hinges, profiles, acrylic sheets)
  - Bulk CSV/Excel inventory import (`import_catalog.py`)
  - Stock level adjustments & warehouse locations
- **Unknowns & Verification Required**:
  - API endpoint specification for stock allocation by Job ID (`VDF-2026-XXXX`)
  - Authentication tokens & secret keys
  - Real-time webhooks for stock depletion notifications

---

## 3. Quotation Application (`Quotation App`)
- **Status**: **UNINSPECTED / INDEPENDENT EXTERNAL SYSTEM**
- **Location**: Source Code Not Provided
- **Assumed Function**: Commercial quotation builder, board square footage formulas, hardware cost calculation, customer quotation revisions.
- **Unknowns & Verification Required**:
  - Source code repository location
  - Database schema & pricing engine calculations
  - Supported export/import formats (PDF, Excel, JSON API)
  - Authentication & API access protocol

---

## 4. Purchase Order (PO) Application (`PO App`)
- **Status**: **UNINSPECTED / INDEPENDENT EXTERNAL SYSTEM**
- **Location**: Source Code Not Provided
- **Assumed Function**: Supplier PO generation, vendor master list, purchase approvals, payment terms to board/hardware suppliers.
- **Unknowns & Verification Required**:
  - Source code repository location
  - Database schema & vendor table structure
  - Support for linking Job Numbers (`VDF-2026-XXXX`) to PO items
  - Webhook triggers for goods receipt notifications
