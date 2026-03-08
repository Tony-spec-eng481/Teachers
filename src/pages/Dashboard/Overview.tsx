// Overview.tsx
import React, { useEffect, useState } from "react";
import { useAuth, axiosInstance } from "../../shared/index";
import {
  BookOpen,
  Layers,
  Calendar,
  FileText,
  Clock,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import "../styles/Overview.css";

interface OverviewData {
  totalUnits: number;
  totalPrograms: number;
  upcomingClasses: any[];
  recentSubmissions: any[];
  notifications: any[];
}

const Overview = () => {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    const fetchOverview = async () => {
      try {
        const response = await axiosInstance.get("/lecturer/overview");
        const notificationsRes = await axiosInstance.get("/student/notifications");
        setData({ ...response.data, notifications: notificationsRes.data || [] });
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch overview", err);
        setError(err.response?.data?.error || "Failed to load overview data");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchOverview();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="loading-text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertCircle className="error-icon" />
        <p className="error-message">{error}</p>
        <button onClick={handleRetry} className="error-retry-btn">
          <RefreshCw size={16} style={{ marginRight: "0.5rem" }} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="overview-container">
      <div className="welcome-header">
        <h1 className="welcome-title">
          Welcome back, {user?.name || "Teacher"}! 👋
        </h1>
        <p className="welcome-subtitle">
          Here's what's happening in your classes today.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <BookOpen className="stat-icon" />
          <div className="stat-value">{data?.totalUnits || 0}</div>
          <div className="stat-label">Total Units Taught</div>
        </div>
        <div className="stat-card">
          <Layers className="stat-icon" />
          <div className="stat-value">{data?.totalPrograms || 0}</div>
          <div className="stat-label">Courses</div>
        </div>
        <div className="stat-card">
          <Calendar className="stat-icon" />
          <div className="stat-value">{data?.upcomingClasses?.length || 0}</div>
          <div className="stat-label">Upcoming Classes</div>
        </div>
        <div className="stat-card">
          <FileText className="stat-icon" />
          <div className="stat-value">
            {data?.recentSubmissions?.length || 0}
          </div>
          <div className="stat-label">Recent Submissions</div>
        </div>
      </div>

      <div className="dashboard-widgets">
        <div className="widget-card">
          <div className="widget-header">
            <Calendar className="widget-header-icon" />
            <h3>Upcoming Live Classes</h3>
          </div>
          <div className="widget-content">
            {data?.upcomingClasses && data.upcomingClasses.length > 0 ? (
              <ul className="classes-list">
                {data.upcomingClasses.map((cls, idx) => (
                  <li key={idx} className="list-item">
                    <div className="item-title">{cls.title}</div>
                    <div className="item-subtitle">
                      <Clock size={14} />
                      {new Date(cls.start_time).toLocaleString()}
                      {cls.unit && (
                        <span className="item-badge">{cls.unit}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <Calendar className="empty-state-icon" />
                <p>No upcoming live classes scheduled.</p>
              </div>
            )}
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-header">
            <FileText className="widget-header-icon" />
            <h3>Recent Submissions</h3>
          </div>
          <div className="widget-content">
            {data?.recentSubmissions && data.recentSubmissions.length > 0 ? (
              <ul className="submissions-list">
                {data.recentSubmissions.map((sub, idx) => (
                  <li key={idx} className="list-item">
                    <div className="item-title">
                      {sub.assignments?.title || "Assignment"}
                    </div>
                    <div className="item-subtitle">
                      <User size={14} />
                      {sub.users?.name || "Student"} •{" "}
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <FileText className="empty-state-icon" />
                <p>No recent submissions.</p>
              </div>
            )}
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-header">
            <AlertCircle className="widget-header-icon" />
            <h3>Recent Notifications</h3>
          </div>
          <div className="widget-content">
            {data?.notifications && data.notifications.length > 0 ? (
              <ul className="notifications-list">
                {data.notifications.slice(0, 5).map((n, idx) => (
                  <li key={idx} className={`list-item ${n.is_read ? '' : 'unread'}`}>
                    <div className="item-title">{n.message}</div>
                    <div className="item-subtitle">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <AlertCircle className="empty-state-icon" />
                <p>No recent notifications.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
