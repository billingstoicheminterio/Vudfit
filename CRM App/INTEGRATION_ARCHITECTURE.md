# VUDFIT Unified Business Operating Platform
## Integration Architecture & Readiness Document (`INTEGRATION_ARCHITECTURE.md`)

> [!IMPORTANT]
> **Architecture Status**: Proposal & Audit Phase.
> VUDFIT currently operates four separate applications. This document outlines the CRM's current verified capabilities and the target integration pattern to safely connect all four applications without data loss, shared database collisions, or disruption to independent operations.

---

## 1. Current CRM Architecture & Confirmed Capabilities

The **VUDFIT CRM Application** located at `e:\VUDFIT APPS\CRM App` has been audited and confirmed as an operational single-domain platform with the following technical baseline:

- **Frontend**: React (Vite) + Lucide Icons + Recharts Analytics + CSS Design System.
- **Backend API**: Node.js + Express REST Server running on port 5000.
- **Database Layer**: Dual-mode engine:
  1. PostgreSQL (`pg` pool) as primary database.
  2. Persistent JSON Storage fallback for offline / dev resilience.
- **Audited Security & Integrity Controls**:
  - Column whitelisting on all dynamic CRUD routes preventing SQL Injection.
  - Parameterized database queries across all endpoints.
  - Advisory transaction locking for atomic Job ID generation (`VDF-2026-XXXX`).
  - Integration audit event logging table (`integration_audit_log`).
  - External reference placeholders (`external_quotation_id`, `external_po_ids`, `external_inventory_ref`).

---

## 2. Information & Source Code Required for Remaining Systems

To complete the full platform integration audit, access to the following 3 external systems is required:

| Application | Current Status | Code Location | Required Information for Audit |
| :--- | :--- | :--- | :--- |
| **CRM App** | Verified & Audited | `e:\VUDFIT APPS\CRM App` | Complete (Active) |
| **Quotation App** | Uninspected | Not Provided | Source code, DB Schema, Pricing Engine Logic, Versioning Rules, API endpoints |
| **Purchase Order (PO) App** | Uninspected | Not Provided | Source code, DB Schema, Vendor Master, Approval Workflow, PO Formats |
| **Inventory App** | Codebase Available in Workspace | `e:\VUDFIT APPS\modular-kitchen-inventory` | API Contracts, Stock Deduction triggers, Item Code taxonomy, Warehouse Schema |

---

## 3. Proposed Target Architecture: Loose Coupling via API & Integration Gateway

```
 +------------------+     +-----------------------+     +-----------------------+     +------------------------+
 |   1. CRM App     |     |  2. Quotation App     |     |   3. PO App           |     |   4. Inventory App     |
 | (Customer & Job) |     |  (Pricing & Quotes)   |     | (Vendor Purchase Orders)|   |  (Stock & Material)    |
 +--------+---------+     +-----------+-----------+     +-----------+-----------+     +-----------+------------+
          |                           |                             |                             |
          +---------------------------+--------------+--------------+-----------------------------+
                                                     |
                                                     v
                                  +------------------------------------+
                                  |   VUDFIT Integration Gateway API   |
                                  |   (Event Bus, HMAC Auth, Retries)  |
                                  +------------------------------------+
                                                     |
                                                     v
                                  +------------------------------------+
                                  |    Integration Audit Log DB        |
                                  |  (Idempotent, Retry Queue, MIS)    |
                                  +------------------------------------+
```

### Key Architectural Principles:
1. **No Shared Database**: Applications MUST NOT connect directly to each other's database tables. Each system maintains its own isolated database.
2. **REST API & Webhooks**: Systems communicate via authenticated HTTPS REST APIs and async event webhooks.
3. **Idempotency**: All cross-system event handlers must require unique transaction tokens to prevent duplicate quotes, purchase orders, or stock deductions.
4. **Resilience & Circuit Breaker**: If the Inventory or PO app is offline, the CRM continues running uninterrupted; outgoing sync events are queued in `integration_audit_log` with automatic retry handlers.

---

## 4. Reconciling Keys & Identifiers Across Systems

| Entity | Primary Owner | Reconciled Key Format | System Mapping Strategy |
| :--- | :--- | :--- | :--- |
| **Customer** | CRM App | `CUST-YYYY-XXXX` | Primary in CRM; referenced in Quotations & Invoices |
| **Project / Job** | CRM App | `VDF-YYYY-XXXX` | Core backbone linking all Quotations, POs, Stock Issues, and Invoices |
| **Quotation** | Quotation App | `QTN-YYYY-XXXX` | Primary in Quotation App; stored as `external_quotation_id` in CRM |
| **Purchase Order** | PO App | `PO-YYYY-XXXX` | Primary in PO App; stored as `external_po_ids` array in CRM |
| **Material Item Code** | Inventory App | `SKU-XXXX-YY` | Primary in Inventory App; mapped to CRM material requirements |

---

## 5. Failure Handling, Retries & Audit Logging

Whenever a cross-system data transfer fails (e.g. CRM tries to notify Inventory App of a material issue while Inventory server is offline):
1. **Event Capture**: The transaction details are saved into `integration_audit_log` with status `PENDING` or `FAILED`.
2. **Exponential Backoff Retry**: A background worker retries the request at 1m, 5m, 15m, and 1h intervals.
3. **Circuit Breaker**: If 5 consecutive attempts fail, the endpoint status is marked `DEGRADED`, alerting administrators without blocking the CRM UI.
4. **Reconciliation Tool**: An admin reconciliation screen allows manual retry or forced synchronization once target services resume.
