// Navbar.tsx
import React from "react";
import { useAuth } from "../shared";
import { Bell, Menu } from "lucide-react";
import "../pages/styles/Navbar.css"; // Add this import

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="dashboard-navbar">
      {/* <div className="navbar-left">
        <button
          className="navbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div className="navbar-search">
          <input type="text" placeholder="Search..." className="search-input" />
        </div>
      </div> */}

      <div className="navbar-right">
        {/* <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button> */}
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.name || "Teacher"}</span>
            <span className="user-role">Teacher</span>
          </div>
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "T"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
