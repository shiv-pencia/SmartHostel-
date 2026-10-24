# Smart Hostel Management System — Progress Report

**Course / Project:** DBMS Course Project 2026  
**Architecture:** MERN Stack (React 19 + Vite 8, Node.js, Express, MongoDB Mongoose)  
**Repository:** [github.com/shiv-pencia/SmartHostel-](https://github.com/shiv-pencia/SmartHostel-)  
**Branch:** `main`  
**Test Pass Rate:** 106 / 106 Tests Passing (85 backend, 21 frontend)  
**Status:** Production Ready  
**Generated Date:** October 25, 2026  

---

## 1. Executive Summary

This report documents the full implementation, optimization, and database population for the **Smart Hostel Management System**. The application has advanced into an operational enterprise campus platform capable of managing room inventories, multi-tiered maintenance tickets, dynamic student bed allocations, real-time vacancy tracking, occupancy statistics, campus notices, and gate pass visitor management.

All **14 official hostels of IIT Guwahati** are modeled in the database with their authentic codes, campus locations, gender segregation policies, and provisioned bed slots. High-scale resident data (**507 accounts**) was seeded to demonstrate production-scale indexing and query performance. Zero broken links or placeholder screens remain, and all architectural bottlenecks have been resolved.

---

## 2. Core Modules Implemented & Tested

### 🛏️ Module 1: Student Allocation & Vacancy Discovery
- **Compound Partial Unique Indexes:** Implemented unique partial indexes in `server/src/models/allocation.model.js` (`{ student: 1 }` and `{ bed: 1 }` with `{ status: "active" }`) to guarantee zero double allocations at the database level.
- **Vacancy Management:** Real-time discovery of vacant beds per hostel block and atomic checkout/vacation.
- **Interactive UI Portals:** Built `AdminAllocationsPage.jsx` for administrators and wardens, and `StudentAllocationPage.jsx` providing students with instant visibility into their room and bed details.

### 🛠️ Module 2: Grievance & Maintenance Tracking
- **Lifecycle Pipeline:** Engineered a complete ticket lifecycle (`pending` ➔ `assigned` ➔ `in_progress` ➔ `resolved` / `rejected`) in `server/src/models/complaint.model.js`.
- **Categorization & Severity:** Categorical filtering (`plumbing`, `electrical`, `carpentry`, `cleanliness`, `internet`, `other`) and 4 severity levels (`low`, `medium`, `high`, `emergency`).
- **Role-Aware Views:**
  - **Students:** File grievances with automatic hostel/room association and track repair notes in real time.
  - **Admins & Wardens:** Review incoming complaints, inspect room details, and assign maintenance staff.
  - **Maintenance Staff:** Work-order dashboard (`StaffTasksPage.jsx`) to transition ticket statuses and submit resolution logs.

### 📊 Module 5: Analytics & Aggregations
- **Live Occupancy Analytics:** Aggregates live occupancy percentages across all 14 IITG hostels.
- **Complaint Metrics:** Real-time breakdown of issues by resolution status, category distribution, and severity.
- **Database Integrity Diagnostics:** Automated detection of orphaned bed/room records and capacity-counter mismatches (`server/src/services/inventoryReport.service.js`).
- **Reporting Dashboard:** Deployed `AdminReportsPage.jsx` featuring styled metric cards, progress indicators, and audit warnings.

### 📢 Extra Modules: Notices & Gate Passes
- **Notice Board System:** Published campus circulars categorized by `general`, `maintenance`, `mess`, and `events` on `StudentNoticesPage.jsx`.
- **Visitor & Gate Pass Management:** Gate pass check-in and 1-click check-out logging for campus security and wardens on `WardenVisitorsPage.jsx`.
- **One-Click Demo Credentials:** Quick-fill demo pill buttons on the login page (`👑 Admin`, `🏢 Warden`, `🛠️ Staff`, `🎓 Student`) for rapid professor presentation.

---

## 3. Database Design & DBMS Innovations

### 🔑 Partial Unique Indexes (Preventing Double Allocation)
In `server/src/models/allocation.model.js`, compound partial unique indexes enforce single-bed exclusivity:
```javascript
AllocationSchema.index(
    { student: 1 },
    { unique: true, partialFilterExpression: { status: "active" } }
);

AllocationSchema.index(
    { bed: 1 },
    { unique: true, partialFilterExpression: { status: "active" } }
);
```
Students can have multiple historical allocations over multiple years, but *strictly at most one active bed* at any single moment.

### ⚡ Adaptive MongoDB Concurrency (`withOptionalTransaction`)
Standard MongoDB standalone instances throw runtime errors when executing multi-document transactions:
> *"Transaction numbers are only allowed on a replica set member or mongos"*

We engineered a dynamic transaction wrapper in `server/src/utils/transaction.js` that verifies replica set capability at runtime: ACID transactions are used if running on a cluster, while standalone servers employ atomic structured rollbacks.

---

## 4. IIT Guwahati Campus Hostels Seeded in Database

| # | Hostel Name | Code | Gender Policy | Campus Location | Provisioned Capacity |
|---|---|---|---|---|---|
| 1 | **Barak Hostel** | `BAR` | Male | North Campus, IIT Guwahati | Rooms 101, 102 (4 beds) |
| 2 | **Brahmaputra Hostel** | `BRH` | Male | North Campus, IIT Guwahati | Rooms A-101, A-102 (5 beds) |
| 3 | **Dhansiri Hostel** | `DHA` | Female | South Campus, IIT Guwahati | Rooms 101, 102 (4 beds) |
| 4 | **Dibang Hostel** | `DIB` | Male | South Campus, IIT Guwahati | Rooms 101, 102 (4 beds) |
| 5 | **Dihing Hostel** | `DIH` | Male | South-East Campus, IIT Guwahati | Rooms 101, 102 (4 beds) |
| 6 | **Disang Hostel** | `DIS` | Male | East Campus, IIT Guwahati | Rooms B-201, B-202 (5 beds) |
| 7 | **Kameng Hostel** | `KAM` | Male | South-West Campus, IIT Guwahati | Rooms 101, 102 (4 beds) |
| 8 | **Kapili Hostel** | `KAP` | Male | Central Campus, IIT Guwahati | Rooms C-301, C-302 (3 beds) |
| 9 | **Lohit Hostel** | `LOH` | Male | Central Campus, IIT Guwahati | Rooms 101, 102 (4 beds) |
| 10 | **Manas Hostel** | `MAN` | Male | West Campus, IIT Guwahati | Rooms 101, 102 (4 beds) |
| 11 | **Married Scholars Hostel** | `MSH` | Coed | Residential Area, IIT Guwahati | Flats 101, 102 (4 beds) |
| 12 | **Siang Hostel** | `SIA` | Male | North-East Campus, IIT Guwahati | Rooms 101, 102 (4 beds) |
| 13 | **Subansiri Hostel** | `SUB` | Female | South Campus, IIT Guwahati | Rooms 101, 102 (4 beds) |
| 14 | **Umiam Hostel** | `UMI` | Male | West Campus, IIT Guwahati | Rooms 101, 102 (4 beds) |

---

## 5. Key Troubleshooting & Security Refactoring

| Issue Identified | Root Cause Diagnosis | Resolution Implemented |
|---|---|---|
| **Warden Blocked on Complaints & Allocations** | `server/src/routes/user.routes.js` had global `authorizeRoles("admin")`. Frontend `Promise.all` calling `/users` failed with 403. | Granted `authorizeRoles("admin", "warden")` to user reads (`GET /users`), allowing wardens to view students and staff without granting account deletion privileges. |
| **"Cannot connect to the server"** | Frontend origin mismatch (`127.0.0.1:5173` vs `localhost:5173`) triggered CORS preflight rejections; Express rate limit throttled rapid page refreshes. | Configured dynamic CORS origin resolver for all local variants and raised development rate limiter to 3,000 req/15min. |
| **Dead / Boilerplate Files** | Repository contained unused starter assets (`App.css`, `index.css`, `ComingSoonPage.jsx`, `DashboardPage.jsx`, `.DS_Store`). | Purged 25+ dead files; updated client and root READMEs to reflect clean directory structure. Verified 0 empty files across repo. |

---

## 6. System Metrics & Presentation Credentials

### 📈 System Metrics
- **Official Hostels:** 14 (All IIT Guwahati)
- **Total Registered Users:** 507 accounts in MongoDB
- **Active Rooms & Beds:** 38 Rooms • 65 Provisioned Beds
- **Backend Unit/Integ Tests:** 85 / 85 Passing (`node --test`)
- **Frontend Integration Tests:** 21 / 21 Passing (`vitest`)
- **Vite Production Build:** Success (221 ms, 0 errors)

### 🔑 Demo Credentials for Presentation
- 👑 **Admin:** `admin@smarthostel.local` / `Admin@123`
- 🏢 **Warden:** `warden.brahmaputra@smarthostel.local` / `Warden@123`
- 🛠️ **Staff:** `staff.maint@smarthostel.local` / `Staff@123`
- 🎓 **Student:** `student.rahul@smarthostel.local` / `StudentPass@123`
