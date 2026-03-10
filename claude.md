# claude.md — AI Agent Guidance for TaskFlow

## Project Overview
TaskFlow is an AI-powered project and task management tool built with Python/Flask (backend), React (frontend), and SQLite (database). It integrates Claude (Anthropic) for intelligent task summarization, suggestion, prioritization, and project status reporting.

---

## Architecture Summary

```
taskflow/
├── backend/               # Flask API
│   ├── app.py             # App factory, DB init, blueprint registration
│   ├── models/models.py   # SQLAlchemy models: Project, Task, Tag
│   ├── routes/
│   │   ├── projects.py    # CRUD for projects
│   │   ├── tasks.py       # CRUD for tasks + tag management
│   │   └── ai.py          # AI endpoints via Anthropic SDK
│   └── requirements.txt
├── frontend/              # React SPA
│   └── src/
│       ├── api/index.js   # Axios API client
│       ├── pages/         # Dashboard, Projects, ProjectDetail
│       └── index.css      # Full design system
├── run.py                 # Entry point
├── .env.example
└── README.md
```

---

## Coding Standards

### Python / Flask
- Use Flask Blueprints for route separation (one per resource)
- SQLAlchemy models should include a `to_dict()` method for clean JSON serialization
- Use `db.session.commit()` only after all mutations are complete
- Always validate required fields before DB writes and return 400 on missing data
- Handle Anthropic API errors with try/except; return 500 with `{"error": str(e)}`
- AI prompts should request JSON-only output and be parsed with `json.loads()`
- Environment variables via `python-dotenv` — never hardcode secrets

### React / Frontend
- Functional components + hooks only (no class components)
- API calls live in `src/api/index.js` — no inline `fetch`/`axios` in components
- `react-hot-toast` for all user feedback (success/error)
- Loading states use the `.spinner` CSS class
- No prop drilling deeper than 2 levels — lift state or use callbacks
- CSS classes follow BEM-lite naming: `block`, `block-element`, `block--modifier`

### Database / Models
- All models have `created_at` and `updated_at` timestamps
- Many-to-many via association table (`task_tags`)
- Cascade deletes on Project → Tasks relationship
- SQLite for development; DATABASE_URL env var supports Postgres in production

---

## AI Integration Rules

### Groq SDK Usage
- Always use `llama3-70b-8192` as the model
- Use the `groq` Python SDK — OpenAI-compatible interface (`client.chat.completions.create`)
- Set `max_tokens` explicitly (200 for summaries, 500–800 for lists)
- Prompts must explicitly request JSON-only output for structured responses
- Strip markdown fences (` ```json `) before `json.loads()` — open-source models sometimes wrap output
- Parse AI JSON responses inside try/except — never trust raw output

### AI Features
| Endpoint | Purpose | Output |
|---|---|---|
| `POST /api/ai/summarize/:id` | Summarize task description | Plain text, saved to DB |
| `POST /api/ai/suggest-tasks` | Suggest 5 new tasks for a project | JSON array |
| `POST /api/ai/prioritize` | Auto-assign priorities to pending tasks | JSON array with task IDs |
| `GET /api/ai/project-summary/:id` | Generate a status update | Plain text |

### Prompt Engineering Guidelines
- Always include full context: project name, description, existing tasks
- Be explicit: "Return ONLY a JSON array... No markdown, no explanation."
- Specify the exact JSON schema in the prompt
- For prioritization, provide task IDs so results can be mapped back

---

## Extension Approach

To add new features, follow this pattern:

1. **New resource** → add model in `models/models.py`, create route file, register blueprint in `app.py`
2. **New AI feature** → add endpoint in `routes/ai.py`, add API call in `frontend/src/api/index.js`, add UI button/panel in relevant page
3. **Auth** → add Flask-Login or JWT middleware; wrap blueprints with `@login_required`
4. **Production DB** → set `DATABASE_URL=postgresql://...` in `.env`; run `alembic upgrade head`

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI response not valid JSON | Wrap `json.loads()` in try/except, return 500 with error |
| Missing API key | Graceful error message to user via toast notification |
| SQLite concurrency | Use Postgres in production (DATABASE_URL env var ready) |
| Large task lists slow AI | Filter to `status != done` before sending to AI |
