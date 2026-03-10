import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getProjects, createProject, deleteProject } from "../api";
import { Plus, Trash2, X, FolderOpen } from "lucide-react";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
];

function CreateProjectModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Project name is required");
    setLoading(true);
    try {
      const res = await createProject({ name, description, color });
      onCreated(res.data);
      toast.success("Project created");
      onClose();
    } catch {
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Project</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            className="form-input"
            placeholder="e.g. Website Redesign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="What is this project about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Color</label>
          <div style={{ display: "flex", gap: 8 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "3px solid white" : "3px solid transparent",
                  cursor: "pointer",
                  outline: color === c ? `2px solid ${c}` : "none",
                  transition: "all 0.15s",
                }}
              />
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : <Plus size={15} />}
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    getProjects()
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!window.confirm("Delete this project and all its tasks?")) return;
    await deleteProject(id);
    setProjects((p) => p.filter((x) => x.id !== id));
    toast.success("Project deleted");
  };

  return (
    <>
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => setProjects((prev) => [p, ...prev])}
        />
      )}

      <div className="page-header">
        <h2>Projects</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Project
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 48 }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto", color: "var(--accent)" }} />
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={48} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
            <h3>No projects yet</h3>
            <p>Create your first project to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => {
              const pct =
                project.task_count > 0
                  ? Math.round((project.completed_count / project.task_count) * 100)
                  : 0;
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="project-card"
                  style={{ "--project-color": project.color }}
                >
                  <div style={{ position: "absolute", top: 14, right: 14 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => handleDelete(e, project.id)}
                      style={{ padding: "4px 6px", color: "var(--text-muted)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="project-card-name">{project.name}</div>
                  <div className="project-card-desc">
                    {project.description || "No description"}
                  </div>
                  <div className="project-progress">
                    <div
                      className="project-progress-bar"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="project-meta">
                    <span>{project.task_count} tasks</span>
                    <span>{pct}% complete</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
