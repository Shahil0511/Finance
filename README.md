# Sales & Returns Finance Tool
## Internal Web Tool — Finance Team Daily Reports

A full-stack internal tool that connects directly to your PostgreSQL or MSSQL database and gives your finance team a self-serve daily dashboard for Sales and Returns reports — with filters, exports, and no dependency on you.

---

## Tech Stack
- **Backend**: Node.js + Express
- **Frontend**: React (single-page app)
- **Database**: PostgreSQL AND/OR MSSQL (configurable per report)
- **Export**: CSV, Excel-ready TSV copy

---

## Project Structure

```
finance-tool/
├── backend/
│   ├── server.js              # Main Express server
│   ├── .env                   # Your DB credentials (DO NOT commit)
│   ├── db/
│   │   ├── postgres.js        # PostgreSQL connection
│   │   └── mssql.js           # MSSQL connection
│   ├── routes/
│   │   ├── sales.js           # Sales report API
│   │   └── returns.js         # Returns report API
│   └── middleware/
│       └── auth.js            # Simple token auth
└── frontend/
    ├── index.html
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── Filters.jsx
        │   ├── DataTable.jsx
        │   └── ExportBar.jsx
        └── pages/
            ├── SalesReport.jsx
            └── ReturnsReport.jsx
```

---

## Setup Instructions

### Step 1 — Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (if using dev mode)
cd ../frontend
npm install
```

### Step 2 — Configure your database

Edit `backend/.env`:

```env
# Choose which DB each report uses
SALES_DB=postgres        # postgres | mssql
RETURNS_DB=mssql         # postgres | mssql

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=your_db_name
PG_USER=your_user
PG_PASSWORD=your_password

# MSSQL (SSMS)
MSSQL_HOST=localhost
MSSQL_PORT=1433
MSSQL_DATABASE=your_db_name
MSSQL_USER=your_user
MSSQL_PASSWORD=your_password
MSSQL_ENCRYPT=false       # true if using Azure SQL

# Auth token for finance team access
API_SECRET=changeme_finance2024

# Server port
PORT=4000
```

### Step 3 — Configure your table/column names

Edit `backend/routes/sales.js` and `backend/routes/returns.js`.
Look for the `TABLE CONFIG` section at the top of each file and map your actual column names.

### Step 4 — Run the backend

```bash
cd backend
node server.js
# Server starts at http://localhost:4000
```

### Step 5 — Serve the frontend

**Option A — Static build (recommended for production):**
```bash
cd frontend
npm run build
# Copy the dist/ folder to your web server (IIS, Nginx, Apache)
```

**Option B — Dev mode:**
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

---

## Finance Team Access

Once deployed, share the internal URL (e.g., `http://192.168.1.100:4000`) with finance team.
They can:
- Filter by year, month, date range (2020 to today)
- Filter by sales channel, region, status
- Filter sales by **handover date**
- Filter returns by **processed date**
- Export any filtered view as CSV
- Copy table directly into Excel

---

## Customization Checklist

- [ ] Update table/column names in `routes/sales.js` and `routes/returns.js`
- [ ] Set correct DB credentials in `.env`
- [ ] Add any extra columns your finance team needs
- [ ] (Optional) Add Windows AD / SSO auth in `middleware/auth.js`
- [ ] (Optional) Schedule auto-email of daily CSV using `node-cron`
