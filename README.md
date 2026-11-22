# TractorConnect (ट्रैक्टर कनेक्ट) 🚜🌾
### Multi-Owner Tractor & Farming Services Marketplace Platform (India)

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v20%2B-brightgreen)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Local%20%7C%20Atlas-green)](https://www.mongodb.com)
[![Express](https://img.shields.io/badge/Express.js-4.21-lightgrey)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com)
[![Tests Passing](https://img.shields.io/badge/Tests-75%2F75%20Passed-success)](npm%20run%20test:all)

---

## 1. Project Overview

**TractorConnect** is a production-grade full-stack MERN marketplace platform connecting agricultural machinery owners with smallholder and commercial farmers across rural and semi-urban India (Madhya Pradesh focus: Sehore, Raisen, Vidisha, Hoshangabad, Bhopal).

The platform features an architectural **Multi-Tractor-Owner Marketplace System**:
1. **Farmers / Customers:** Self-register, pinpoint field locations on an interactive GPS map, discover nearby approved tractor contractors within their operational radius, compare contractor rates and fleet availability side-by-side, and book jobs.
2. **Tractor Owners:** Register their business profile, depot location coordinates, and service radius. Once approved by the platform administrator, each owner independently manages their own service catalog, custom prices, tractor fleet, driver assignments, work execution, diesel logs, and offline Cash/UPI ledgers.
3. **Platform Administrator:** Maintains system oversight, monitors all registered tractor contractors, reviews pending verification requests, and approves, suspends, or reactivates contractor accounts.

---

## 2. Key Features & Business Logic

### 🇮🇳 Indian Localization & Context
- **Currency & Numbering:** All amounts formatted using Indian numbering rules (`Intl.NumberFormat('en-IN')`, e.g., `₹1,25,000.00`).
- **Land & Service Units:** Primary agricultural unit is **acres** (`per_acre`), with flexible support for `per_hour`, `per_trip`, and `per_day`.
- **Mobile-First Authentication:** Uses 10-digit Indian mobile numbers (`^[6-9]\d{9}$`), normalized without `+91`.
- **Time Zone:** Stored in MongoDB in standard UTC and converted to Indian Standard Time (**IST / Asia/Kolkata**) in the UI and reports.

### 🚜 Multi-Tractor-Owner Marketplace
- **Separate Farmer vs Owner Portals:** Dedicated registration and login interfaces for Farmers (`/login`, `/register`) and Tractor Owners (`/owner/login`, `/owner/register`).
- **Platform Admin Verification:** Every tractor contractor undergoes verification by the platform administrator (`approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended'`) before becoming bookable by farmers.
- **Farmer Nearby Discovery Engine:** Farmers specify their field location (via GPS or village/district), and the backend calculates exact Haversine distances to approved contractor depots. Farmers can sort by nearest distance, lowest price, or machine availability, and compare up to 3 contractors side-by-side.
- **Booking Routing & Strict Isolation:** A farmer selects their preferred contractor, and the booking request routes exclusively to that contractor. Cross-owner data access is strictly blocked with backend `403 Forbidden` authorization.
- **Independent Services & Custom Pricing:** Contractors independently set their own service offerings and rates (e.g. Ramesh sets Deep Ploughing at ₹850/acre, Suresh sets it at ₹900/acre).
- **Immutable Pricing Snapshots:** When a booking is created, an immutable `serviceSnapshot` (service name, pricing unit, unit price, minimum charge) is permanently embedded into the booking. Subsequent price adjustments never retroactively change historical bookings.
- **Tractor Overlap Conflict Detection:** The scheduling engine mathematically prevents double-booking a tractor across overlapping time windows (`start < existingEnd && end > existingStart`).
- **Safe Offline Payment Tracking:** No risky payment gateways. Tracks manual **Cash** and **UPI** payments with transaction reference numbers. Prevents overpayments against the pending balance, and logs audit reasons for any voided receipts.
- **Security Middlewares:** Strict HTTP Content Security Policy via Helmet, CORS origin whitelisting, Express Rate Limiting (100 requests per 15 min; 10 attempts on login/register), MongoDB query sanitization against NoSQL injection, and HPP parameter pollution defense.
- **CSV Injection Defense:** All downloadable CSV spreadsheets use UTF-8 BOM (`\uFEFF`) for Excel compatibility and sanitize cell strings by prepending a single quote (`'`) to any values starting with `=`, `+`, `-`, or `@`.

---

## 3. Project File Structure

```
TRECTOR/
├── package.json               # Root scripts (install:all, dev, test:all, seed)
├── README.md                  # Complete project documentation & guide
├── ARCHITECTURE.md            # Architecture diagrams, ER models, security specs
├── client/                    # React 18 + Vite + Tailwind CSS Frontend
│   ├── .env                   # Client environment variables
│   ├── index.html             # Single Page Application HTML entry point
│   ├── vite.config.js         # Vite configuration with Vitest setup
│   ├── tailwind.config.js     # Agricultural green/amber theme palette
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js       # Central Axios instance with JWT interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global auth state & role flags (customer, owner, admin)
│   │   ├── components/
│   │   │   ├── Navbar.jsx     # Navigation bar with portal switchers
│   │   │   ├── Footer.jsx     # Footer with contact & quick links
│   │   │   ├── AdminLayout.jsx# Responsive admin sidebar & topbar
│   │   │   ├── OwnerLayout.jsx# Independent tractor owner sidebar & approval banner
│   │   │   ├── FieldLocationPicker.jsx # Leaflet map picker & GPS button
│   │   │   └── routes/
│   │   │       ├── ProtectedRoute.jsx # Farmer route guard
│   │   │       ├── OwnerRoute.jsx     # Tractor owner route guard
│   │   │       └── AdminRoute.jsx     # Platform admin route guard
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── Home.jsx           # Landing page with marketplace search CTA
│   │   │   │   ├── Services.jsx       # Public service catalog
│   │   │   │   ├── About.jsx          # Agricultural platform story
│   │   │   │   ├── Contact.jsx        # Contact & support hotline
│   │   │   │   ├── Login.jsx          # Farmer login with owner switcher
│   │   │   │   ├── Register.jsx       # Farmer registration
│   │   │   │   ├── OwnerLogin.jsx     # Dedicated tractor owner login
│   │   │   │   └── OwnerRegister.jsx  # Tractor owner registration with depot & radius
│   │   │   ├── customer/
│   │   │   │   ├── CustomerDashboard.jsx # Farmer dashboard & active bookings
│   │   │   │   ├── FindTractorOwners.jsx # Nearby discovery & side-by-side comparison
│   │   │   │   ├── NewBooking.jsx     # Service booking with contractor preselection
│   │   │   │   ├── MyBookings.jsx     # Farmer booking history with status filters
│   │   │   │   ├── BookingDetail.jsx  # Status timeline, depot distance & invoice
│   │   │   │   └── Profile.jsx        # Profile details & password update
│   │   │   ├── owner/
│   │   │   │   ├── OwnerDashboard.jsx # Owner KPIs, revenue, dues & fleet status
│   │   │   │   ├── OwnerServices.jsx  # Independent service CRUD & pricing units
│   │   │   │   ├── OwnerTractors.jsx  # Fleet CRUD & availability switcher
│   │   │   │   ├── OwnerBookings.jsx  # Accept, reject, schedule & complete jobs
│   │   │   │   ├── OwnerWorkRecords.jsx # Completed jobs & billing records
│   │   │   │   ├── OwnerPayments.jsx  # Record manual Cash/UPI & void payments
│   │   │   │   ├── OwnerExpenses.jsx  # Log diesel purchases & maintenance
│   │   │   │   └── OwnerReports.jsx   # Owner earnings, village stats & CSV exports
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx # Platform wide KPIs & charts
│   │   │       ├── AdminOwners.jsx    # Review & approve pending contractor accounts
│   │   │       ├── ServicesManagement.jsx # Platform service oversight
│   │   │       ├── BookingsManagement.jsx # Platform dispatch & scheduling
│   │   │       ├── TractorManagement.jsx  # Fleet oversight
│   │   │       ├── WorkRecordsList.jsx    # Work records & billing overview
│   │   │       ├── PaymentsManagement.jsx # Payments ledger
│   │   │       ├── ExpensesManagement.jsx # Expenses tracking
│   │   │       ├── CustomersManagement.jsx# Farmer directory
│   │   │       └── Reports.jsx        # Platform analytics & CSV exports
│   │   ├── utils/
│   │   │   ├── formatters.js  # Currency (INR), date (IST) & mobile formatters
│   │   │   └── leafletIcons.js # Leaflet SVG markers
│   │   └── tests/
│   │       ├── App.test.jsx
│   │       ├── auth.test.jsx
│   │       ├── bookingEstimate.test.jsx
│   │       └── multiOwnerFrontend.test.jsx # Dedicated multi-owner UI tests
└── server/                    # Node.js + Express + Mongoose Backend
    ├── .env                   # Server environment configuration
    ├── src/
    │   ├── app.js             # Express app with security middlewares & routes
    │   ├── index.js           # Server entry point & graceful shutdown
    │   ├── config/
    │   │   ├── env.js         # Centralized environment variable validation
    │   │   └── db.js          # Mongoose connection with retry & fallback
    │   ├── models/
    │   │   ├── User.js        # Accounts (customer, owner, admin) with depot location
    │   │   ├── Service.js     # Owner-scoped dynamic service catalog
    │   │   ├── ServicePriceHistory.js # Immutable price change history
    │   │   ├── Tractor.js     # Owner-scoped fleet assets with HP & status
    │   │   ├── Booking.js     # Bookings with tractorOwner ref & snapshot
    │   │   ├── WorkRecord.js  # Work execution bill, diesel & balance due
    │   │   ├── Payment.js     # Cash/UPI payment records with void audit
    │   │   └── Expense.js     # Owner fleet expenses & fuel logs
    │   ├── routes/
    │   │   ├── authRoutes.js       # Farmer/owner auth & admin owner approvals
    │   │   ├── discoveryRoutes.js  # Nearby contractor discovery & owner profiles
    │   │   ├── serviceRoutes.js    # Owner-scoped service management
    │   │   ├── tractorRoutes.js    # Fleet management
    │   │   ├── bookingRoutes.js    # Routed bookings lifecycle
    │   │   ├── workRecordRoutes.js # Work records & billing
    │   │   ├── paymentRoutes.js    # Manual Cash & UPI payments
    │   │   ├── expenseRoutes.js    # Fleet expenses
    │   │   ├── reportRoutes.js     # Scoped analytics & CSV streams
    │   │   └── customerRoutes.js   # Customer directory
    │   ├── services/
    │   │   ├── authService.js
    │   │   ├── discoveryService.js # Haversine distance engine & sorting
    │   │   ├── serviceService.js
    │   │   ├── tractorService.js   # Overlap detection & conflict prevention
    │   │   ├── bookingService.js   # Owner routing & immutable snapshot
    │   │   ├── workRecordService.js
    │   │   ├── paymentService.js
    │   │   ├── expenseService.js
    │   │   └── reportService.js
    │   ├── utils/
    │   │   ├── geo.js         # Haversine distance formula implementation
    │   │   ├── formatters.js   # Indian currency, IST date & numbers
    │   │   └── csvExport.js    # Formula injection-proof CSV generator
    │   ├── seed/
    │   │   └── seed.js        # Multi-owner Indian farm marketplace demo seeder
    │   └── tests/
    │       ├── foundation.test.js           # 9 tests
    │       ├── auth.test.js                 # 14 tests
    │       ├── multiOwner.test.js           # 18 tests (dedicated marketplace tests)
    │       ├── service.test.js              # 5 tests
    │       ├── bookingLifecycle.test.js     # 5 tests
    │       └── paymentExpenseReport.test.js # 7 tests
```

---

## 4. Quick-Start Installation

### Step 1: Install Dependencies
```bash
npm run install:all
```

### Step 2: Seed the Database
Populate local MongoDB with Platform Admin, 3 Tractor Owners (2 approved, 1 pending), 10 Farmers, custom services, tractors, bookings, work records, payments, and expenses:
```bash
npm run seed
```

### Step 3: Start Development Servers
```bash
npm run dev
```
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 5. Demo Accounts & Credentials

The seed script (`server/src/seed/seed.js`) provisions the following verified accounts:

| Role | Mobile Number | Password | Name / Business | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Admin** | `9876543210` | `Admin@Tractor2025` | Ramesh Patel (Admin) | Platform oversight & contractor verification |
| **Tractor Owner (Approved)** | `9826111111` | `Owner@123` | Patidar Krishi Yantra Seva | 2 tractors (Mahindra, John Deere), 25 km radius |
| **Tractor Owner (Approved)** | `9826222222` | `Owner@123` | Mewada Agro & Tractor Services | 2 tractors (Sonalika, Farmtrac), 30 km radius |
| **Tractor Owner (Pending)** | `9826333333` | `Owner@123` | Sharma Farm Machinery | Pending verification in Admin panel |
| **Farmer (Customer)** | `9826011111` | `Customer@123` | Shivraj Singh | Farmer in Bilkisganj, Sehore |
| **Farmer (Customer)** | `9826022222` | `Customer@123` | Jagdish Meena | Farmer in Mandideep, Raisen |

---

## 6. Complete API Route Reference

### 🛡️ System & Discovery
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System uptime & MongoDB status |
| `GET` | `/api/v1/discovery/nearby-owners` | Public | Discovers approved contractors by field coordinates/village |
| `GET` | `/api/v1/discovery/owners/:id` | Public | Detailed public profile and catalog of a tractor contractor |

### 🔑 Authentication & Approvals (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/farmer/register` | Public | Register farmer (Customer) account |
| `POST` | `/api/v1/auth/owner/register` | Public | Register tractor contractor account (pending approval) |
| `POST` | `/api/v1/auth/login` | Public | Login with mobile + password |
| `GET` | `/api/v1/auth/me` | Logged In | Get profile of logged-in user |
| `GET` | `/api/v1/auth/owners` | Admin Only | Get all tractor contractors with status/search filters |
| `PATCH`| `/api/v1/auth/owners/:id/approval`| Admin Only | Approve, reject, or suspend a contractor account |

### 🌾 Services & Pricing (`/api/v1/services`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/services` | Public | List active public services |
| `GET` | `/api/v1/services/admin/all` | Admin / Owner | List owner's scoped services catalog |
| `POST` | `/api/v1/services` | Admin / Owner | Create new service & record initial price |
| `PUT` | `/api/v1/services/:id` | Admin / Owner | Update service (enforces cross-owner isolation) |
| `PATCH`| `/api/v1/services/:id/toggle-active`| Admin / Owner | Activate / deactivate service |
| `GET` | `/api/v1/services/:id/price-history`| Logged In | View immutable price audit trail |

### 🚜 Fleet Management (`/api/v1/tractors`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tractors` | Admin / Owner | List fleet tractors (scoped to owner) |
| `POST` | `/api/v1/tractors` | Admin / Owner | Add tractor with registration number & HP |
| `PUT` | `/api/v1/tractors/:id` | Admin / Owner | Update tractor details |
| `PATCH`| `/api/v1/tractors/:id/status`| Admin / Owner | Switch status (`available`, `in_use`, `maintenance`) |

### 📋 Bookings & Scheduling (`/api/v1/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/bookings` | Customer | Create booking routed to selected contractor |
| `GET` | `/api/v1/bookings/my` | Customer | Farmer's own booking history |
| `GET` | `/api/v1/bookings/owner/all` | Admin / Owner | Owner's routed bookings (scoped to owner) |
| `PATCH`| `/api/v1/bookings/owner/:id/accept` | Admin / Owner | Accept booking request |
| `PATCH`| `/api/v1/bookings/owner/:id/reject` | Admin / Owner | Reject booking with audit reason |
| `PATCH`| `/api/v1/bookings/owner/:id/schedule`| Admin / Owner | Assign tractor & schedule time (overlap protected) |
| `PATCH`| `/api/v1/bookings/owner/:id/start` | Admin / Owner | Start fieldwork (`in_progress`) |

### 📝 Work Records & Billing (`/api/v1/work-records`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/work-records` | Logged In | List work records (scoped by role) |
| `POST` | `/api/v1/work-records/complete-booking/:id` | Admin / Owner | Complete job, log diesel & generate bill |

### 💵 Payments Tracking (`/api/v1/payments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/payments/admin/all` | Admin / Owner | List payments (scoped to owner) |
| `POST` | `/api/v1/payments` | Admin / Owner | Record manual Cash/UPI payment (overpayment blocked) |
| `PATCH`| `/api/v1/payments/:id/void` | Admin / Owner | Void payment entry with audit note |

### ⛽ Expenses & Reports (`/api/v1/expenses`, `/api/v1/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/expenses` | Admin / Owner | List fleet expenses (scoped to owner) |
| `POST` | `/api/v1/expenses` | Admin / Owner | Log diesel purchase or maintenance cost |
| `GET` | `/api/v1/reports/dashboard` | Admin / Owner | Real-time KPIs, revenue, dues & profit |
| `GET` | `/api/v1/reports/export/csv` | Admin / Owner | Sanitized UTF-8 BOM CSV stream |

---

## 7. Automated Test Suites (75/75 Passing)

### Backend Tests (60 tests across 6 suites)
```bash
npm run test
```
- `src/tests/multiOwner.test.js`: **18 passed** (separate registration, admin approvals, owner services, discovery, routing, overlap checks, cross-owner 403 isolation)
- `src/tests/auth.test.js`: **14 passed** (registration, login, profile, password change, RBAC)
- `src/tests/foundation.test.js`: **9 passed** (health, 404, Indian context formatters, CSV sanitization)
- `src/tests/bookingLifecycle.test.js`: **7 passed** (price snapshot immutability, state machine, work record creation, end-to-end multi-owner routing & ownerId unwrap verification)
- `src/tests/paymentExpenseReport.test.js`: **7 passed** (Cash/UPI tracking, overpayment prevention, void audit, CSV export)
- `src/tests/service.test.js`: **5 passed** (service CRUD, price history audit, slug generation)

### Frontend Tests (15 tests across 4 suites)
```bash
npm run test:client
```
- `src/tests/bookingEstimate.test.jsx`: **7 passed** (live cost calculation, INR formatting, ownerId string normalization)
- `src/tests/auth.test.jsx`: **4 passed** (form validation & error states)
- `src/tests/multiOwnerFrontend.test.jsx`: **3 passed** (owner login, owner registration with depot & radius, nearby discovery & contractor comparison)
- `src/tests/App.test.jsx`: **1 passed** (app rendering & routing)



## 8. Developer Information

**Developed By:** Dikesh Choure

**Role:** Full Stack Developer

**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)

**Project:** TractorConnect – Multi-Owner Tractor & Farming Services Marketplace

**LinkedIn:** https://www.linkedin.com/in/dikesh-choure-242b21301/

