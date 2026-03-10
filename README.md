# TaskFlow — AI-Powered Project Manager

> A full-stack project and task management tool with integrated AI capabilities powered by Anthropic's Claude.

---

## Features

- **Project Management** — Create, edit, and delete projects with color-coded organization
- **Kanban Board** — Visualize tasks across To Do / In Progress / Done columns
- **Task Management** — Full CRUD with priorities, due dates, and tags
- **AI Task Summarization** — Generate concise summaries from task descriptions (Claude)
- **AI Task Suggestions** — Get 5 relevant task suggestions for any project (Claude)
- **AI Auto-Prioritization** — Automatically assign priorities to pending tasks (Claude)
- **AI Project Status** — Generate a natural-language project health report (Claude)
- **Dashboard** — Overview of all task counts, project progress, and recent activity

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, Flask 3.0, Flask-SQLAlchemy |
| Frontend | React 18, React Router 6, Axios |
| Database | SQLite (dev) / PostgreSQL (prod-ready via env var) |
| AI | Groq API — Llama 3 70B (`llama3-70b-8192`) — free tier |
| Styling | Custom CSS design system (no UI framework) |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Groq API key — free, no credit card needed ([get one at console.groq.com](https://console.groq.com))

### 1. Clone & Configure

```bash
git clone <repo-url>
cd taskflow
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
cd ..
python run.py
# Flask API running at http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
# React app running at http://localhost:3000
```

---

## API Reference

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/` | List all projects |
| POST | `/api/projects/` | Create a project |
| GET | `/api/projects/:id` | Get project with tasks |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project + tasks |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/` | List tasks (filterable by project, status, priority) |
| POST | `/api/tasks/` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| PATCH | `/api/tasks/:id/status` | Update status only |
| DELETE | `/api/tasks/:id` | Delete a task |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/summarize/:task_id` | Generate AI summary for task |
| POST | `/api/ai/suggest-tasks` | Suggest 5 new tasks for project |
| POST | `/api/ai/prioritize` | Auto-prioritize pending tasks |
| GET | `/api/ai/project-summary/:id` | Generate project status report |

---

## Key Technical Decisions

### 1. Flask Blueprints for Separation of Concerns
Each resource (`projects`, `tasks`, `ai`) has its own Blueprint registered in the app factory. This keeps routes modular and independently testable.

### 2. SQLAlchemy with Cascade Deletes
The `Project → Task` relationship uses `cascade="all, delete-orphan"`, ensuring referential integrity without manual cleanup. Tags use a many-to-many association table.

### 3. AI via Anthropic SDK (not REST)
The official `anthropic` Python SDK is used rather than raw HTTP calls, providing better error handling and type safety. All AI prompts explicitly request JSON-only output and are parsed defensively.

### 4. SQLite → PostgreSQL Migration Path
The `DATABASE_URL` environment variable is the single source of truth for the DB connection string. Switching to Postgres in production requires only an `.env` change.

### 5. Stateless AI Calls
AI endpoints are stateless — they read from the DB, call Claude, and either return data or persist the result (e.g. `ai_summary` on Task). No AI context is stored between requests.

---

## Database Schema

```
projects
  id, name, description, color, created_at, updated_at

tasks
  id, title, description, status, priority, due_date,
  ai_summary, project_id (FK), created_at, updated_at

tags
  id, name (unique)

task_tags (association)
  task_id (FK), tag_id (FK)
```

---

## AI Usage & Guidance Files

See [`claude.md`](./claude.md) for:
- Full coding standards used when building with AI assistance
- Prompt engineering guidelines for each AI feature
- Extension patterns for adding new features
- Risk analysis and mitigations

---

## Extension Roadmap

- **Authentication** — Flask-Login or JWT for multi-user support
- **Drag-and-drop Kanban** — `@hello-pangea/dnd` integration
- **Due date reminders** — Celery + Redis background tasks
- **AI Sprint Planning** — Group tasks into time-boxed sprints
- **PostgreSQL + Docker** — Production-ready containerization
- **Real-time updates** — WebSockets for collaborative editing
