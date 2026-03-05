import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../shared/index";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import "../styles/Announcements.css";


interface Announcement {
  id: string;
  title: string;
  content: string;
  target_role: string;
  created_at: string;
}

const Announcements = () => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target: "all",
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }, { 'align': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image', 'video', 'color', 'background', 'clean', 'align', 'script'
];


  const fetchAnnouncements = async () => {
    try {
      const response = await axiosInstance.get("/announcements");
      setAnnouncements(response.data);
    } catch (error) {
      toast.error("Failed to load announcements");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuillChange = (content: string) => {
    setFormData(prev => ({ ...prev, message: content }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      toast.error("Fill all fields");
      return;
    }

    try {
      setLoading(true);

      await axiosInstance.post("/announcements/", {
        title: formData.title,
        content: formData.message, // 🔥 convert message → content
        target_role: formData.target, // 🔥 convert target → target_role
        expires_at: null,
      });

      toast.success("Announcement broadcasted successfully");

      setFormData({
        title: "",
        message: "",
        target: "all",
      });
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="announcements-container">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Send and view announcements.</p>
        </div>
        <a
          href="https://chat.whatsapp.com/YOUR_INVITE_LINK_HERE"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{
            background: "#25D366",
            borderColor: "#25D366",
            color: "white",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>💬</span> Join WhatsApp Group
        </a>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
        className="grid-cols-1 lg:grid-cols-2"
      >
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>New Announcement</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter announcement subject"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select
                name="target"
                className="form-control"
                value={formData.target}
                onChange={handleChange}
              >
                <option value="all">All Students</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Message</label>
              <ReactQuill
                theme="snow"
                value={formData.message}
                onChange={handleQuillChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Type your announcement message here..."
                style={{ height: '200px', marginBottom: '50px' }}
              />
            </div>


            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send Announcement"}
            </button>
          </form>
        </div>

        <div
          className="card"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <h3 style={{ marginBottom: "1rem" }}>Previous Announcements</h3>
          {fetching ? (
            <p className="text-gray-500">Loading...</p>
          ) : announcements.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                flex: 1,
                overflowY: "auto",
                maxHeight: "500px",
                paddingRight: "8px",
              }}
            >
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    padding: "16px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <h4
                      style={{
                        fontWeight: 600,
                        color: "var(--white)",
                        margin: 0,
                      }}
                    >
                      {ann.title}
                    </h4>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        padding: "4px 8px",
                        background: "var(--white)",
                        color: "var(--blue-600)",
                        borderRadius: "20px",
                      }}
                    >
                      {ann.target_role === "all" ? "Everyone" : ann.target_role}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--white)",
                      marginBottom: "12px",
                    }}
                  >
                    {new Date(ann.created_at).toLocaleString()}
                  </div>
                  <div
                    style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                      color: "var(--white)",
                    }}
                    dangerouslySetInnerHTML={{ __html: ann.content }}
                  />

                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No announcements found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
