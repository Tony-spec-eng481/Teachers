/**
 * ZoomClass.tsx — Teacher's Live Class Room (Zoom Integration)
 *
 * ROLE: Teacher (host)
 * - Shows meeting info and pre-join screen
 * - "Start Meeting" opens Zoom start_url (host link) in new tab
 * - Updates class status to "live" when teacher starts
 * - "End Class" updates status to "ended"
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../shared/index";
import toast from "react-hot-toast";
import "../styles/ZoomClass.css";

interface ClassInfo {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  role: string;
  userName: string;
  zoomMeetingId: number;
  joinUrl: string;
  password: string;
}

const ZoomClass = () => {
  const { channelName } = useParams<{ channelName: string }>();
  const navigate = useNavigate();

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [classStatus, setClassStatus] = useState("scheduled");
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  // ─── Fetch class info ──────────────────────────────────────────────
  useEffect(() => {
    if (!channelName) {
      toast.error("Invalid class");
      navigate("/dashboard/live-classes");
      return;
    }

    const fetchClassInfo = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `/live-classes/join-info/${channelName}`
        );
        setClassInfo(res.data);
        setClassStatus(res.data.status || "scheduled");
      } catch (err) {
        toast.error("Failed to load class info");
        navigate("/dashboard/live-classes");
      } finally {
        setLoading(false);
      }
    };
    fetchClassInfo();
  }, [channelName, navigate]);

  // ─── Session Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStartTime) return;
    const interval = setInterval(() => {
      const diff = Date.now() - sessionStartTime;
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // ─── Start Meeting ─────────────────────────────────────────────────
  const startMeeting = async () => {
    if (!classInfo?.joinUrl) {
      toast.error("No Zoom meeting URL available");
      return;
    }

    // Open Zoom in new tab
    window.open(classInfo.joinUrl, "_blank", "noopener,noreferrer");

    // Update class status to "live"
    try {
      await axiosInstance.patch(`/live-classes/${classInfo.id}/status`, {
        status: "live",
      });
      setClassStatus("live");
      setSessionStartTime(Date.now());
      toast.success("Meeting started! Zoom is opening in a new tab.");
    } catch (err) {
      console.warn("Could not update class status:", err);
    }
  };

  // ─── End Class ─────────────────────────────────────────────────────
  const endClass = async () => {
    if (!classInfo?.id) return;

    try {
      await axiosInstance.patch(`/live-classes/${classInfo.id}/status`, {
        status: "ended",
      });
      setClassStatus("ended");
      setSessionStartTime(null);
      toast.success("Class ended successfully.");
    } catch (err) {
      toast.error("Failed to end class");
    }
  };

  // ─── Loading State ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="zc-loading">
        <div className="zc-spinner" />
        <span>Preparing your classroom...</span>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="zc-loading">
        <span>Class not found</span>
        <button
          className="zc-back-btn"
          onClick={() => navigate("/dashboard/live-classes")}
        >
          ← Back to Classes
        </button>
      </div>
    );
  }

  // ─── Format dates ──────────────────────────────────────────────────
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  // ─── Main UI ───────────────────────────────────────────────────────
  return (
    <div className="zc-room">
      {/* Top Bar */}
      <div className="zc-topbar">
        <div className="zc-topbar-left">
          <span className="zc-topbar-title">🎓 {classInfo.title}</span>
          <span
            className={`zc-topbar-badge ${classStatus === "live" ? "zc-badge-live" : classStatus === "ended" ? "zc-badge-ended" : "zc-badge-scheduled"}`}
          >
            {classStatus === "live"
              ? "● Live"
              : classStatus === "ended"
                ? "Ended"
                : "Scheduled"}
          </span>
        </div>

        <div className="zc-topbar-center">
          {classStatus === "live" && (
            <div className="zc-session-timer">⏱️ {elapsedTime}</div>
          )}
        </div>

        <div className="zc-topbar-right">
          <button
            className="zc-nav-btn"
            onClick={() => {
              window.close();
              navigate("/dashboard/live-classes");
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="zc-content">
        <div className="zc-meeting-card">
          {/* Zoom Icon */}
          <div className="zc-zoom-icon">
            <svg viewBox="0 0 48 48" width="64" height="64">
              <rect width="48" height="48" rx="12" fill="#2D8CFF" />
              <path
                d="M14 17h14c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H14c-1.1 0-2-.9-2-2V19c0-1.1.9-2 2-2zm20 2l6-4v18l-6-4V19z"
                fill="white"
              />
            </svg>
          </div>

          <h2 className="zc-meeting-title">{classInfo.title}</h2>

          <div className="zc-meeting-details">
            <div className="zc-detail-item">
              <span className="zc-detail-icon">📅</span>
              <span>{formatDate(classInfo.startTime)}</span>
            </div>
            <div className="zc-detail-item">
              <span className="zc-detail-icon">🕐</span>
              <span>
                {formatTime(classInfo.startTime)} —{" "}
                {classInfo.endTime ? formatTime(classInfo.endTime) : "TBD"}
              </span>
            </div>
            {classInfo.zoomMeetingId && (
              <div className="zc-detail-item">
                <span className="zc-detail-icon">🔗</span>
                <span>Meeting ID: {classInfo.zoomMeetingId}</span>
              </div>
            )}
            {classInfo.password && (
              <div className="zc-detail-item">
                <span className="zc-detail-icon">🔑</span>
                <span>Password: {classInfo.password}</span>
              </div>
            )}
          </div>

          <div className="zc-meeting-role">
            <span className="zc-role-badge teacher">👨‍🏫 Host (Teacher)</span>
            <span className="zc-role-name">{classInfo.userName}</span>
          </div>

          {/* Action Buttons */}
          <div className="zc-actions">
            {classStatus !== "ended" ? (
              <>
                <button className="zc-start-btn" onClick={startMeeting}>
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {classStatus === "live"
                    ? "Rejoin Meeting"
                    : "Start Meeting"}
                </button>
                {classStatus === "live" && (
                  <button className="zc-end-btn" onClick={endClass}>
                    End Class
                  </button>
                )}
              </>
            ) : (
              <div className="zc-ended-message">
                <p>This class has ended.</p>
                <button
                  className="zc-back-btn"
                  onClick={() => {
                    window.close();
                    navigate("/dashboard/live-classes");
                  }}
                >
                  ← Back to Classes
                </button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="zc-tips">
            <h4>💡 Tips</h4>
            <ul>
              <li>Click "Start Meeting" to open Zoom as the host</li>
              <li>Students will join via their own Zoom link</li>
              <li>Use Zoom's built-in controls for recording, screen share, and chat</li>
              <li>Click "End Class" when finished to update the status</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomClass;
