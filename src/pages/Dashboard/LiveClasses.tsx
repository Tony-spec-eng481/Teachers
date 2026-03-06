import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../shared/index";
import toast from "react-hot-toast";
import "../styles/LiveClassRoom.css";

interface Unit {
  id: string;
  unit_id: string;
  title: string;
  short_code: string;
}

interface LiveClass {
  id: string;
  title: string;
  unit_id: string;
  start_time: string;
  end_time: string;
  live_url: string;
  status: string;
}

const LiveClasses = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    unit_id: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsRes, overviewRes] = await Promise.all([
          axiosInstance.get("/lecturer/units"),
          axiosInstance.get("/lecturer/overview"),
        ]);
        setUnits(unitsRes.data);
        if (unitsRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, unit_id: unitsRes.data[0].id }));
        }

        try {
          const classesRes = await axiosInstance.get("/lecturer/live-classes");
          setClasses(classesRes.data);
        } catch (e) {
          setClasses(overviewRes.data.upcomingClasses || []);
        }
      } catch (err: any) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!formData.unit_id) {
        toast.error("Please select a unit");
        return;
      }
      const payload = {
        title: formData.title,
        unit_id: formData.unit_id,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };
      await axiosInstance.post("/live-classes", payload);
      toast.success("Live class scheduled successfully!");
      const classesRes = await axiosInstance.get("/lecturer/live-classes");
      setClasses(classesRes.data);
      setFormData({
        title: "",
        unit_id: formData.unit_id,
        start_time: "",
        end_time: "",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to schedule class");
    } finally {
      setSubmitting(false);   
    }
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <div className="loading-text">Loading classes...</div>
        </div>
      </div>
    );

  const openLiveClass = (classId: string) => {
    window.open(
      `/dashboard/live-classes/room/${classId}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="live-classes-container">
      <div className="live-classes-wrapper">
        <div className="page-header">
          <h1 className="page-title">Live Classes</h1>
          <p className="page-subtitle">
            Schedule and manage interaction sessions with students.
          </p>
        </div>

        <div className="grid grid-cols-2">
          {/* Schedule Form Card */}
          <div className="card">
            <h3>Schedule New Class</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter class title"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  name="unit_id"
                  value={formData.unit_id}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select a unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.title} ({unit.short_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="datetime-group">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary mt-4"
                disabled={submitting}
              >
                {submitting ? "Scheduling..." : "Schedule Class"}
              </button>
            </form>
          </div>

          {/* Upcoming Classes Card */}
          <div className="card">
            <h3>Upcoming Classes</h3>
            {classes.length > 0 ? (
              <div className="classes-list">
                {classes.map((cls) => (
                  <div key={cls.id} className="class-item">
                    <div className="class-header">
                      <h4 className="class-title">{cls.title}</h4>
                      <span className="class-badge">
                        {cls.status || "Scheduled"}
                      </span>
                    </div>
                    <div className="class-time">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(cls.start_time).toLocaleString()} -{" "}
                      {new Date(cls.end_time).toLocaleTimeString()}
                    </div>
                    {cls.live_url && (
                      <div className="class-actions">
                        <button
                          className="btn-primary"
                          onClick={() => openLiveClass(cls.id)}
                        >
                          Join Class
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No upcoming classes scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default LiveClasses;
