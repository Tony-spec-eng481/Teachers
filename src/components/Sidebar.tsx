// Sidebar.tsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../shared";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar,
  Users,
  Settings,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
    { to: "/dashboard/courses", icon: BookOpen, label: "Courses" },
    { to: "/dashboard/students", icon: Users, label: "Students" },
    { to: "/dashboard/content", icon: FileText, label: "Content" },
    { to: "/dashboard/live-classes", icon: Calendar, label: "Live Classes" },
    { to: "/dashboard/assignments", icon: FileText, label: "Assignments" },
    { to: "/dashboard/announcements", icon: Calendar, label: "Announcements" },
    { to: "/dashboard/profile", icon: Settings, label: "Profile" },
  ];

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="teacher-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-logo">📚</span>
          <span className="brand-name">Trespics Teacher</span>
        </div>
        {onClose && (
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            onClick={handleNavClick}
          >
            <item.icon size={20} />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
