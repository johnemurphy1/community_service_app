# Community Service Records App

A full-stack web application for tracking student community service hours, built with **Node.js**, **Express**, **PostgreSQL**, and vanilla HTML/CSS/JS.

---

## Features

- **Log Hours** — Submit student name, supervisor, activity description, hours, and date
- **Search** — Find all service records for a student by name (partial match)
- **All Records** — Browse every entry in the database
- **Edit / Delete** — Revise or remove any record inline

---

## Project Structure

```
community-service-app/
├── server.js          # Express app + all API routes
├── db.js              # PostgreSQL connection pool
├── schema.sql         # Run once to create the DB table
├── package.json
├── .env.example       # Copy to .env for local dev
├── .gitignore
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## API Reference

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | `/api/records`                    | Fetch all records        |
| POST   | `/api/records`                    | Create a new record      |
| GET    | `/api/records/search?student_name=` | Search by student name |
| GET    | `/api/records/:id`                | Fetch one record         |
| PUT    | `/api/records/:id`                | Update a record          |
| DELETE | `/api/records/:id`                | Delete a record          |

**POST / PUT body (JSON):**
```json
{
  "student_name": "Jane Doe",
  "supervisor_name": "Mr. Smith",
  "activity_description": "Food bank sorting",
  "hours": 4.5,
  "service_date": "2024-03-15"
}
```

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Steps

1. **Clone / download** this project.

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a local `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Fill in your local PostgreSQL connection string:
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/community_service
   NODE_ENV=development
   PORT=3000
   ```

4. **Create the database and run the schema:**
   ```bash
   psql -U postgres -c "CREATE DATABASE community_service;"
   psql -U postgres -d community_service -f schema.sql
   ```

5. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

---

## Deploying to Render.com

### Step 1 — Push to GitHub
Push your project to a GitHub (or GitLab) repository.

### Step 2 — Create a PostgreSQL Database on Render
1. Go to [render.com](https://render.com) → **New +** → **PostgreSQL**
2. Give it a name (e.g. `community-service-db`)
3. Choose the **Free** plan → **Create Database**
4. After creation, copy the **Internal Database URL** (use this for services on Render) or the **External Database URL** (for connecting locally)

### Step 3 — Initialize the Schema
In the Render PostgreSQL dashboard, click **Connect** → **PSQL Command**, then run:
```sql
\i schema.sql
```
Or paste the contents of `schema.sql` directly into the shell.

### Step 4 — Create a Web Service on Render
1. **New +** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   | Setting | Value |
   |---------|-------|
   | **Environment** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Plan** | Free |

4. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | *(paste the Internal Database URL from Step 2)* |
   | `NODE_ENV` | `production` |

5. Click **Create Web Service** — Render will build and deploy automatically.

### Step 5 — Done!
Your app will be live at `https://your-service-name.onrender.com`.

> **Note:** On the free tier, Render spins down inactive services after ~15 minutes. The first request after a sleep may take 30–60 seconds to respond.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string |
| `NODE_ENV` | ✅ | Set to `production` on Render |
| `PORT` | Auto | Render sets this automatically |
