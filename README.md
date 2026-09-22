# AI-Powered Project & Task Management Platform

## 1. Project Title
AI-Powered Project & Task Management Platform

## 2. Project Overview
This project is a full-stack, AI-enhanced platform designed to streamline project management and task tracking. It features a modern, responsive frontend built with Next.js and Tailwind CSS, and a robust backend API powered by FastAPI and MongoDB. The platform leverages **Google Gemini AI** (`gemini-3.8-flash`) to intelligently assist users with generating project descriptions, breaking projects down into structured tasks, auto-prioritizing backlogs, and providing proactive productivity insights.

## 3. Problem Statement
Managing projects and organizing tasks can often become chaotic as the scale of a project grows. Traditional tools require significant manual effort to set up projects, write detailed descriptions, and constantly triage and prioritize the ever-growing backlog of tasks, leading to decreased productivity and decision fatigue.

## 4. Solution
This platform solves these challenges by combining intuitive, premium UI design with Google Gemini AI Copilot capabilities. It automates the tedious aspects of project management—such as drafting project descriptions, generating actionable task lists, and determining task priorities—allowing teams to focus on actual execution rather than administrative overhead.

## 5. Features
- **User Authentication**: Secure JWT-based registration and login system with bcrypt password hashing.
- **Dashboard**: High-level overview of active projects, tasks, and Gemini productivity insights.
- **Project Management**: Create, read, update, and delete (CRUD) projects with status tracking (Active, On Hold, Completed).
- **Task Management**: Comprehensive task CRUD operations, assignment tracking, due dates, and status boards.
- **AI Assistant**: Dedicated AI assistant powered by Google Gemini for tasks generation, project drafting, prioritization, and insights.
- **Responsive UI**: A highly polished, mobile-responsive interface with micro-interactions, loading states, and elegant typography.
- **Secure Architecture**: Environment variables management, backend-only AI credentials, protected API routes, and horizontal privilege escalation prevention.

## 6. AI Provider & Features

### AI Provider
**Google Gemini** (Exclusively using Google's official `google-genai` SDK)

### Model
**`gemini-3.8-flash`**

### AI Capabilities
- **Auto-Generate Project Descriptions**: Input a project title, and Google Gemini drafts a comprehensive, professional project description.
- **Breakdown Tasks Generation**: Gemini analyzes project scope and generates 5-8 structured, actionable tasks with titles, descriptions, and priority levels.
- **Smart Task Prioritization**: Gemini evaluates active backlog tasks based on agile dependencies and business value, updating priorities (High, Medium, Low).
- **Productivity Insights**: Proactive, metrics-driven suggestions and encouragement to optimize workflow flow.
- **Health Check Probe**: Dedicated health endpoint verifying Gemini connectivity (`GEMINI_CONNECTION_OK`).

## 7. Technology Stack
- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Lucide React (Icons).
- **Backend**: Python 3, FastAPI, Pydantic, Motor (Asynchronous MongoDB driver), PyJWT, Passlib, Google GenAI SDK (`google-genai`).
- **AI Provider**: Google Gemini (`gemini-3.8-flash`).
- **Database**: MongoDB.

## 8. Architecture
The application follows a decoupled client-server architecture:
- **Client**: A Next.js application that handles routing, state management (via React hooks), UI rendering, and communicates with the backend via REST API. The client **never** holds or exposes AI API credentials.
- **Server**: A FastAPI application that serves RESTful endpoints, handles business logic, securely communicates with the Google Gemini API via a centralized service (`GeminiService`), and interfaces with MongoDB using asynchronous drivers.

```text
┌─────────────────┐
│ Next.js Frontend│
└────────┬────────┘
         │ REST API (Bearer JWT)
         ▼
┌─────────────────┐
│  FastAPI Backend │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemini Service │
└────────┬────────┘
         │ google-genai SDK
         ▼
┌─────────────────┐
│  Google Gemini  │
│ gemini-3.8-flash│
└─────────────────┘
```

## 9. Project Structure
```text
/
├── .env.example       # Example environment variables
├── .gitignore         # Git ignore rules
├── backend/           # FastAPI application
│   ├── app/           # Application code (api, core, models, services)
│   │   ├── api/v1/    # API endpoints (auth, projects, tasks, copilot)
│   │   ├── core/      # Config, security, exception handlers
│   │   ├── db/        # MongoDB connection management
│   │   └── services/  # Business logic & gemini_service.py
│   ├── tests/         # Pytest test suites (including test_gemini.py)
│   └── requirements.txt # Python dependencies (includes google-genai)
└── frontend/          # Next.js application
    ├── app/           # App router pages and layouts
    ├── components/    # Reusable UI components
    ├── hooks/         # Custom React hooks (e.g., useAuth)
    ├── services/      # API communication layers (copilot.ts, etc.)
    └── tailwind.config.ts
```

## 10. MongoDB Setup
Ensure you have MongoDB running locally or have a remote MongoDB URI (like MongoDB Atlas).
- Default local URI: `mongodb://localhost:27017`
- The application will automatically create the required database and collections upon first connection and data insertion.

## 11. Environment Variables Configuration

Copy `.env.example` to `.env` in the root directory (or in `backend/.env`):

```env
# Backend
API_PORT=8000
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=project_db

# JWT Configuration
JWT_SECRET=your_super_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# AI Configuration (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

> **Security Notice**: `GEMINI_API_KEY` must **only** be stored on the backend. Never expose this key in frontend code or prefix it with `NEXT_PUBLIC_`. Ensure `.env` is listed in `.gitignore`.

### Obtaining a Google Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **Create API Key**.
4. Copy your key and paste it into `backend/.env` as `GEMINI_API_KEY=...`.

## 12. Installation & Setup

### Prerequisites
- Node.js (v18+) and npm
- Python (3.10+)
- MongoDB (local or Atlas)

### Backend Setup
1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` in `backend/.env` with your `GEMINI_API_KEY`.

### Frontend Setup
1. Navigate to `/frontend`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

## 13. How to Run the Application

### Start the Backend
From the `backend` directory with virtual environment activated:
```bash
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Interactive documentation (Swagger): `http://localhost:8000/docs`

### Start the Frontend
From the `frontend` directory:
```bash
npm run dev
```
Frontend web application will run at: `http://localhost:3000`

## 14. Testing

### Run Backend Tests
From the `backend` directory:
```bash
pytest
```
Runs the full test suite including auth, projects, tasks, and the Google Gemini AI test suite (`tests/test_gemini.py`).

### Test Gemini AI Health Endpoint
With the backend running and authenticated, you can test the Gemini probe:
```bash
curl -X GET "http://localhost:8000/api/v1/copilot/health" -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```
Expected response:
```json
{
  "status": "ok",
  "provider": "Google Gemini",
  "model": "gemini-3.8-flash",
  "ping": "GEMINI_CONNECTION_OK"
}
```

### Type Checking Frontend
From the `frontend` directory:
```bash
npx tsc --noEmit
```

## 15. License
MIT
