# Smart Career Guidance System + Job Recommendations

An AI-powered full-stack career development, skill assessment, and job matching ecosystem supporting both **IT careers** and **Non-IT careers**.

## Technology Stack
- **Frontend**: React.js with Vite, Lucide Icons, Glassmorphism UI
- **Backend**: Python FastAPI, Pydantic v2
- **Database**: MongoDB (Motor async driver) with In-Memory fallback store
- **Dataset**: JSON seeds & MongoDB collections for IT & Non-IT careers, skills, 50+ assessment questions, portfolio projects, and sample job postings with LinkedIn/Naukri direct links.

---

## Folder Structure
```
smart-career-guidance/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Health, Seed, Careers, Questions, Jobs, Projects routes
│   │   ├── core/           # Config & MongoDB database connection manager
│   │   ├── db/seeds/       # IT & Non-IT career seed data & 50 assessment questions
│   │   ├── models/         # Pydantic data schemas
│   │   └── main.py         # FastAPI application entrypoint
│   ├── venv/               # Python virtual environment
│   ├── requirements.txt
│   └── .env.example
├── dataset/                # Raw JSON dataset files (careers, questions, jobs, projects)
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, GlassCard, UI design system
│   │   ├── pages/          # HomePage dashboard view
│   │   ├── services/       # Axios API client
│   │   ├── index.css       # Custom glassmorphic color theme & styling
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── README.md
```

---

## How to Run

### 1. Run Backend (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Run Uvicorn dev server
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`.  
- Interactive API Docs (Swagger): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/v1/health`

### 2. Run Frontend (React + Vite)
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies (if not installed)
npm install

# Start Vite development server
npm run dev
```
Frontend will run at `http://localhost:5173`.
