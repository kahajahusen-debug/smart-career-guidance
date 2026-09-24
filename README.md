# Smart Career Guidance System + Job Recommendations

An AI-powered full-stack career guidance, skill assessment, and job matching platform supporting both **IT careers** and **Non-IT careers**.

---

## Architecture Overview

- **Client (`client/`)**: React.js with Vite, Lucide Icons, Glassmorphism UI tokens.
- **Server (`server/`)**: Python FastAPI, Pydantic v2, Motor async MongoDB connector.
- **Database**: MongoDB (`mongodb://localhost:27017`, DB Name: `smart_career_guidance`).
- **Dataset (`dataset/`)**: Raw JSON dataset files for Careers, Questions, Jobs, and Projects.

---

## Directory Structure

```
smart-career-guidance/
│
├── client/                     # React + Vite frontend application
│   ├── src/
│   │   ├── components/         # Reusable glassmorphic UI components
│   │   ├── pages/              # Portal views & dashboards
│   │   ├── services/           # Axios API client setup (VITE_API_URL)
│   │   ├── index.css           # Modern SaaS Glassmorphic Design System
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── server/                     # Python FastAPI backend server
│   ├── app/
│   │   ├── api/v1/             # Endpoints: /health, /seed, /careers, /questions, /jobs, /projects
│   │   ├── core/               # Configuration & MongoDB Motor client setup
│   │   ├── db/seeds/           # IT & Non-IT career seed data & 50 assessment questions
│   │   ├── models/             # Pydantic data schemas
│   │   └── main.py             # FastAPI application entrypoint
│   ├── venv/                   # Isolated Python virtual environment
│   ├── run.py                  # Server launcher with app-only reload configuration
│   ├── requirements.txt
│   └── .env.example
│
├── dataset/                    # Raw JSON dataset files
│   ├── careers.json            # 10 Careers (5 IT, 5 Non-IT)
│   ├── questions.json          # 50 Assessment Questions (Difficulty Levels 1-5)
│   ├── jobs.json               # Sample Jobs with LinkedIn/Naukri direct links
│   └── projects.json           # Portfolio Projects
│
├── README.md
└── .gitignore
```

---

## Prerequisites & Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB (Running locally on `mongodb://localhost:27017`)

---

## Running the Application

### 1. Start the FastAPI Backend (`server/`)
```powershell
# Navigate to server directory
cd server

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Start FastAPI server (watches 'app/' directory to prevent venv reload loops)
uvicorn app.main:app --reload --reload-dir app --port 8000
```
- **Backend API Base**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check Endpoint**: `http://localhost:8000/api/v1/health`

### 2. Start the React Frontend (`client/`)
```powershell
# Open a new terminal and navigate to client directory
cd client

# Install dependencies (if not already installed)
npm install

# Start Vite dev server
npm run dev
```
- **Frontend App**: `http://localhost:5173`

---

## Verified Phase 1 Endpoints

- `GET /api/v1/health` - System health and database connectivity status
- `GET /api/v1/careers` - List all 10 career profiles (supports `?category=IT` and `?category=Non-IT`)
- `GET /api/v1/questions` - List 50 assessment questions (supports `?difficulty=1..5` and `?category=IT`)
- `GET /api/v1/jobs` - List sample job postings with LinkedIn & Naukri external search links
- `GET /api/v1/projects` - List portfolio project recommendations
