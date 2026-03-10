import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getProject, createTask, updateTask, deleteTask, updateTaskStatus,
  summarizeTask, suggestTasks, prioritizeTasks, getProjectSummary,
} from "../api";
import { Plus, X, Sparkles, Trash2, ChevronLeft, Wand2, FileText, Search } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";

const STATUSES = [
  { key: "todo", label: "To Do", color: "#9ca3af" },
  { key: "in_progress", label: "In Progress", color: "#5b5bd6" },
  { key: "done", label: "Done", color: "#16a34a" },
];

// Confetti
function fireConfetti() {
  const colors = ["#5b5bd6","#ec4899","#f97316","#16a34a","#eab308","#06b6d4"];
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const dot = document.createElement("div");
      dot.style.cssText = `position:fixed;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:9999;
        left:${Math.random()*100}vw;top:-10px;background:${colors[Math.floor(Math.random()*colors.length)]};
        animation:confettiFall ${1+Math.random()}s ease-in forwards;transform:rotate(${Math.random()*360}deg)`;
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 2500);
    }, i * 20);
  }
}

function isOverdue(due_date) {
  if (!due_date) return false;
  return isPast(parseISO(due_date));
}

function TaskModal({ task, projectId, onClose, onSaved, onDeleted }) {
  const isNew = !task;
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState(task?.status || "todo");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [tags, setTags] = useState((task?.tags || []).join(", "));
  const [dueDate, setDueDate] = useState(task?.due_date ? task.due_date.substring(0, 10) : "");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(task?.ai_summary || "");

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title is required");
    setLoading(true);
    const data = {
      title, description, status, priority,
      project_id: projectId,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      due_date: dueDate || null,
    };
    try {
      let res;
      if (isNew) { res = await createTask(data); toast.success("Task created"); }
      else { res = await updateTask(task.id, data); toast.success("Task updated"); }
      onSaved(res.data);
      onClose();
    } catch { toast.error("Failed to save task"); }
    finally { setLoading(false); }
  };

  const handleSummarize = async () => {
    if (!task || !description) return toast.error("Save a description first");
    setSummarizing(true);
    try {
      const res = await summarizeTask(task.id);
      setSummary(res.data.summary);
      toast.success("AI summary generated");
    } catch { toast.error("AI summarization failed"); }
    finally { setSummarizing(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    await deleteTask(task.id);
    toast.success("Task deleted");
    onDeleted(task.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isNew ? "New Task" : "Edit Task"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="Add more details..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        {summary && (
          <div className="ai-panel" style={{ marginBottom: 16 }}>
            <div className="ai-panel-header">
              <Sparkles size={13} color="var(--accent)" />
              <span className="ai-panel-title">AI Summary</span>
            </div>
            <p className="ai-summary-text">{summary}</p>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" placeholder="e.g. backend, api" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {!isNew && (
              <>
                <button className="btn btn-ai btn-sm" onClick={handleSummarize} disabled={summarizing}>
                  {summarizing ? <span className="spinner" /> : <Sparkles size={13} />} AI Summary
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}><Trash2 size={13} /></button>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {isNew ? "Create Task" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick, onDragStart, onDragEnd }) {
  const overdue = isOverdue(task.due_date) && task.status !== "done";
  return (
    <div
      className={`task-card ${overdue ? "task-overdue" : ""} ${task.status === "done" ? "task-done" : ""}`}
      onClick={() => onClick(task)}
      draggable
      onDragStart={e => onDragStart(e, task)}
      onDragEnd={onDragEnd}
    >
      {overdue && <div className="overdue-badge">⚠️ Overdue</div>}
      <div className="task-card-title" style={task.status === "done" ? { textDecoration: "line-through", color: "var(--text-muted)" } : {}}>
        {task.title}
      </div>
      <div className="task-card-meta">
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        {task.due_date && (
          <span className="tag" style={{ color: overdue ? "var(--danger)" : undefined }}>
            {format(parseISO(task.due_date), "MMM d")}
          </span>
        )}
        {task.tags?.map(tag => <span key={tag} className="tag">{tag}</span>)}
      </div>
      {task.ai_summary && (
        <div className="task-card-ai">
          <Sparkles size={10} style={{ display: "inline", marginRight: 4 }} />
          {task.ai_summary}
        </div>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState({});
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const load = useCallback(() => {
    getProject(id).then(res => {
      setProject(res.data);
      setTasks(res.data.tasks || []);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Check if all tasks done → confetti
  useEffect(() => {
    if (tasks.length > 0 && tasks.every(t => t.status === "done")) {
      fireConfetti();
      toast.success("🎉 All tasks complete!");
    }
  }, [tasks]);

  const handleSaved = task => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      return exists ? prev.map(t => t.id === task.id ? task : t) : [task, ...prev];
    });
  };

  const handleDeleted = taskId => setTasks(prev => prev.filter(t => t.id !== taskId));

  const handleSuggest = async () => {
    setAiLoading(l => ({ ...l, suggest: true }));
    try {
      const res = await suggestTasks(id);
      setSuggestions(res.data.suggestions);
      toast.success(`${res.data.suggestions.length} suggestions ready`);
    } catch { toast.error("AI suggestion failed"); }
    finally { setAiLoading(l => ({ ...l, suggest: false })); }
  };

  const handlePrioritize = async () => {
    setAiLoading(l => ({ ...l, prioritize: true }));
    try {
      const res = await prioritizeTasks(id);
      res.data.updated_tasks.forEach(t => setTasks(prev => prev.map(x => x.id === t.id ? t : x)));
      toast.success("Tasks re-prioritized by AI");
    } catch { toast.error("Prioritization failed"); }
    finally { setAiLoading(l => ({ ...l, prioritize: false })); }
  };

  const handleProjectSummary = async () => {
    setAiLoading(l => ({ ...l, summary: true }));
    try {
      const res = await getProjectSummary(id);
      setAiSummary(res.data.summary);
    } catch { toast.error("Summary failed"); }
    finally { setAiLoading(l => ({ ...l, summary: false })); }
  };

  const addSuggestion = async s => {
    const res = await createTask({ title: s.title, description: s.description, priority: s.priority, project_id: parseInt(id) });
    setTasks(prev => [res.data, ...prev]);
    setSuggestions(prev => prev.filter(x => x.title !== s.title));
    toast.success("Task added");
  };

  // Drag & drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => { setDraggedTask(null); setDragOverCol(null); };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    setDragOverCol(colKey);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedTask || draggedTask.status === newStatus) return;
    const updated = { ...draggedTask, status: newStatus };
    setTasks(prev => prev.map(t => t.id === draggedTask.id ? updated : t));
    try {
      await updateTaskStatus(draggedTask.id, newStatus);
    } catch {
      setTasks(prev => prev.map(t => t.id === draggedTask.id ? draggedTask : t));
      toast.error("Failed to update status");
    }
    setDraggedTask(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  if (loading) return (
    <div style={{ padding: "48px", textAlign: "center" }}>
      <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto", color: "var(--accent)" }} />
    </div>
  );

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s.key] = filteredTasks.filter(t => t.status === s.key);
    return acc;
  }, {});

  return (
    <>
      {(showCreate || selectedTask) && (
        <TaskModal
          task={selectedTask}
          projectId={parseInt(id)}
          onClose={() => { setShowCreate(false); setSelectedTask(null); }}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      <div className="page-header">
        <div>
          <Link to="/projects" style={{ color: "var(--text-muted)", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
            <ChevronLeft size={13} /> Projects
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: project?.color, flexShrink: 0 }} />
            <h2>{project?.name}</h2>
          </div>
          {project?.description && <p className="text-muted text-sm" style={{ marginTop: 3 }}>{project.description}</p>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ai btn-sm" onClick={handleProjectSummary} disabled={aiLoading.summary}>
            {aiLoading.summary ? <span className="spinner" /> : <FileText size={13} />} AI Status
          </button>
          <button className="btn btn-ai btn-sm" onClick={handlePrioritize} disabled={aiLoading.prioritize}>
            {aiLoading.prioritize ? <span className="spinner" /> : <Wand2 size={13} />} Auto-Prioritize
          </button>
          <button className="btn btn-ai btn-sm" onClick={handleSuggest} disabled={aiLoading.suggest}>
            {aiLoading.suggest ? <span className="spinner" /> : <Sparkles size={13} />} Suggest Tasks
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus size={13} /> Add Task
          </button>
        </div>
      </div>

      <div className="page-body">
        {aiSummary && (
          <div className="ai-panel" style={{ marginBottom: 20 }}>
            <div className="ai-panel-header">
              <Sparkles size={13} color="var(--accent)" />
              <span className="ai-panel-title">AI Project Status</span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", padding: "2px 6px" }} onClick={() => setAiSummary("")}><X size={13} /></button>
            </div>
            <p className="ai-summary-text">{aiSummary}</p>
          </div>
        )}

        {suggestions.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <Sparkles size={14} color="var(--accent)" />
              <h3 style={{ fontSize: 14 }}>AI Suggested Tasks</h3>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setSuggestions([])}>Clear</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion-card">
                  <div className="suggestion-card-content">
                    <div className="suggestion-card-title">{s.title}</div>
                    <div className="suggestion-card-desc">{s.description}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`badge badge-${s.priority}`}>{s.priority}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => addSuggestion(s)}><Plus size={12} /> Add</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="search-filter-bar">
          <div className="search-input-wrap">
            <Search size={13} color="var(--text-muted)" />
            <input
              className="search-input"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="btn btn-ghost btn-sm" style={{ padding: "2px 4px" }} onClick={() => setSearch("")}><X size={12} /></button>}
          </div>
          <div className="filter-chips">
            {["all", "high", "medium", "low"].map(p => (
              <button
                key={p}
                className={`filter-chip ${filterPriority === p ? "active" : ""}`}
                onClick={() => setFilterPriority(p)}
              >
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban */}
        <div className="kanban-board">
          {STATUSES.map(col => (
            <div
              key={col.key}
              className={`kanban-column ${dragOverCol === col.key ? "kanban-drag-over" : ""}`}
              onDragOver={e => handleDragOver(e, col.key)}
              onDrop={e => handleDrop(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
            >
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: col.color }} />
                  {col.label}
                </div>
                <span className="kanban-column-count">{tasksByStatus[col.key]?.length || 0}</span>
              </div>
              <div className="kanban-column-body">
                {(tasksByStatus[col.key] || []).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={setSelectedTask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
                {tasksByStatus[col.key]?.length === 0 && (
                  <div className="kanban-empty">
                    {dragOverCol === col.key ? "Drop here" : "No tasks"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
