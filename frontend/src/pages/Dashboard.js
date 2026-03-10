import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProjects, getTasks } from "../api";
import { CheckSquare, Clock, AlertCircle, FolderOpen } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProjects(), getTasks()])
      .then(([pRes, tRes]) => {
        setProjects(pRes.data);
        setTasks(tRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const highPriority = tasks.filter(
    (t) => t.priority === "high" && t.status !== "done"
  ).length;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);

  if (loading) {
    return (
      <div style={{ padding: "48px 36px", textAlign: "center" }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto", color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <FolderOpen size={15} /> View Projects
        </Link>
      </div>

      <div className="page-body">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--text-secondary)" }}>{todo}</div>
            <div className="stat-label">To Do</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--accent-bright)" }}>{inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--success)" }}>{done}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--danger)" }}>{highPriority}</div>
            <div className="stat-label">High Priority</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Recent Tasks */}
          <div>
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>Recent Tasks</h3>
            {recentTasks.length === 0 ? (
              <div className="empty-state">
                <CheckSquare size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <p>No tasks yet. Start by creating a project.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentTasks.map((task) => (
                  <div key={task.id} className="card" style={{ padding: "12px 16px" }}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                          {task.title}
                        </div>
                        <div className="flex gap-2">
                          <span
                            className="tag"
                            style={{ fontSize: 11 }}
                            title={task.project_name}
                          >
                            {task.project_name}
                          </span>
                          <span className={`badge badge-${task.priority}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <span className={`badge badge-${task.status}`}>
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects Overview */}
          <div>
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>Projects</h3>
            {projects.length === 0 ? (
              <div className="empty-state">
                <FolderOpen size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <p>No projects yet.</p>
                <Link to="/projects" className="btn btn-primary btn-sm">
                  Create Project
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.slice(0, 6).map((project) => {
                  const pct =
                    project.task_count > 0
                      ? Math.round((project.completed_count / project.task_count) * 100)
                      : 0;
                  return (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="card"
                      style={{ textDecoration: "none", padding: "14px 16px" }}
                    >
                      <div className="flex items-center justify-between mb-4" style={{ marginBottom: 10 }}>
                        <div className="flex items-center gap-2">
                          <div
                            className="dot"
                            style={{ background: project.color, width: 10, height: 10, borderRadius: "50%" }}
                          />
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{project.name}</span>
                        </div>
                        <span className="text-muted text-sm">{pct}%</span>
                      </div>
                      <div className="project-progress">
                        <div
                          className="project-progress-bar"
                          style={{ width: `${pct}%`, background: project.color }}
                        />
                      </div>
                      <div className="text-sm text-muted" style={{ marginTop: 6 }}>
                        {project.completed_count} / {project.task_count} tasks
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
