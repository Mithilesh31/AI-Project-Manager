import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LayoutDashboard, FolderOpen, Sun, Moon } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import "./index.css";

export const ThemeContext = createContext();
export function useTheme() { return useContext(ThemeContext); }

function KanbanLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="5" rx="1"/>
      <rect x="3" y="11" width="8" height="10" rx="1"/>
      <rect x="13" y="3" width="8" height="10" rx="1"/>
      <rect x="13" y="16" width="8" height="5" rx="1"/>
    </svg>
  );
}

function Sidebar() {
  const { dark, setDark } = useTheme();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><KanbanLogo /></div>
        <div>
          <h1>TaskFlow</h1>
          <span>AI Project Manager</span>
        </div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-label">Navigation</div>
        <NavLink to="/" end className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
          <LayoutDashboard size={15} /> Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
          <FolderOpen size={15} /> Projects
        </NavLink>
      </div>

      {/* Theme toggle pinned to bottom of sidebar */}
      <div className="sidebar-bottom">
        <div className="theme-toggle-row" onClick={() => setDark(!dark)}>
          <Sun size={14} style={{ color: !dark ? "var(--accent)" : "var(--text-muted)" }} />
          <div className={`toggle-track ${dark ? "on" : ""}`}>
            <div className="toggle-thumb" />
          </div>
          <Moon size={14} style={{ color: dark ? "var(--accent)" : "var(--text-muted)" }} />
          <span className="theme-toggle-label">{dark ? "Dark" : "Light"}</span>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: dark ? "#18181f" : "#ffffff",
              color: dark ? "#f0f0ff" : "#111827",
              border: dark ? "1px solid #2e2e40" : "1px solid #e5e7eb",
              fontFamily: "'Inter', sans-serif",
              fontSize: "13.5px",
            },
          }}
        />
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}
