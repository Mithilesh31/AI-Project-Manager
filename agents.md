# agents.md — Agentic Development Rules for TaskFlow

## When Using AI to Develop This Codebase

### Scope Rules
- Never modify `.env` or add hardcoded secrets
- Always use the existing `db` instance from `backend/app.py` — never create a new SQLAlchemy instance
- All new routes must be registered as Blueprints in `backend/app.py`
- All new frontend API calls go in `frontend/src/api/index.js`

### File Modification Order
When adding a new feature:
1. Model first (`backend/models/models.py`)
2. Route file (`backend/routes/<resource>.py`)
3. Blueprint registration (`backend/app.py`)
4. API client function (`frontend/src/api/index.js`)
5. UI component / page update

### Constraints
- Do not install packages not listed in `requirements.txt` or `package.json` without documenting why
- Do not use `eval()` or `exec()` anywhere
- All AI-generated JSON must be parsed with try/except — never assume valid JSON from LLM output
- React components must not contain direct `fetch()` or `axios` calls — use `src/api/index.js`

### Testing Before Commit
- Verify Flask starts with `python run.py`
- Verify all API endpoints return expected shape with curl or Postman
- Verify React builds with `npm run build` (no build errors)
- Test AI endpoints with and without a valid API key

### Prompt Templates for AI Endpoints

**For JSON output from Claude:**
```
[task context here]

Return ONLY a JSON [array/object] with the following shape:
[schema here]
No markdown formatting. No explanation. No preamble. Raw JSON only.
```

**For text output from Claude:**
```
[context here]
Generate a [N]-sentence [type] that [goal].
Be [tone]. Focus on [key aspect].
```
