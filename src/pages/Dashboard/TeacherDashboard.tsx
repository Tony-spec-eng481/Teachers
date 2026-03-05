// TeacherDashboard.tsx
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
// import Navbar from "../../components/Navbar";
import { FiMenu, FiX } from "react-icons/fi";
import "../styles/dashboard.css";

const TeacherDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Menu Toggle - Only visible on mobile */}
      {isMobile && (
        <button
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Sidebar onClose={closeSidebar} />
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* <Navbar onMenuClick={toggleSidebar} /> */}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}
    </div>
  );
};

export default TeacherDashboard;
