// Assignments.tsx
import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../shared/index";
import toast from "react-hot-toast";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { FiEdit, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import "../styles/Assignments.css";

// ... (interfaces remain the same)
interface Unit {
  id: string; // lecturer_unit id
  unit_id: string;
  title: string;
  short_code: string;
}

interface Assignment {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  due_date: string;
  file_url?: string;
  created_at: string;
  units?: { title: string; short_code: string };
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  submitted_at: string;
  grade?: string;
  users?: {
    name: string;
    email: string;
    student_details?: { student_id: string }[];
  };
  assignments?: {
    title: string;
    unit_id: string;
    units?: { title: string };
  };
}

const Assignments = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false); // New state for modal

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    unit_id: string;
    description: string;
    due_date: string;
    file_url: string | File;
  }>({
    title: "",
    unit_id: "",
    description: "",
    due_date: "",
    file_url: "",
  });

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }, { align: [] }],
      ["link", "image", "video"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "video",
    "color",
    "background",
    "clean",
    "align",
    "script",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsRes, assignRes, subRes] = await Promise.all([
          axiosInstance.get("/lecturer/units"),
          axiosInstance.get("/lecturer/assignments"),
          axiosInstance.get("/lecturer/submissions"),
        ]);

        setUnits(unitsRes.data);
        if (unitsRes.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            unit_id: unitsRes.data[0].unit_id,
          }));
        }

        setAssignments(assignRes.data);
        setSubmissions(subRes.data);
      } catch (err: any) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const target = e.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    const { name, value, type } = target;
    if (type === "file") {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        setFormData({ ...formData, [name]: files[0] });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleQuillChange = (content: string) => {
    setFormData((prev) => ({ ...prev, description: content }));
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unit = units.find((u) => u.id === e.target.value);
    if (unit) {
      setFormData({ ...formData, unit_id: unit.unit_id });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.unit_id) return toast.error("Please select a unit");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("unit_id", formData.unit_id);
      data.append("description", formData.description);
      data.append("due_date", formData.due_date);

      if (formData.file_url instanceof File) {
        data.append("file", formData.file_url);
      } else if (formData.file_url) {
        data.append("file_url", formData.file_url);
      }

      if (isEditing && editingId) {
        await axiosInstance.patch(`/lecturer/assignments/${editingId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Assignment updated successfully!");
      } else {
        await axiosInstance.post("/lecturer/assignments", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Assignment created successfully!");
      }

      const assignRes = await axiosInstance.get("/lecturer/assignments");
      setAssignments(assignRes.data);

      resetForm();
      setShowForm(false); // Close modal after successful submission
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save assignment");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      unit_id: units.length > 0 ? units[0].unit_id : "",
      description: "",
      due_date: "",
      file_url: "",
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (assign: Assignment) => {
    setFormData({
      title: assign.title,
      unit_id: assign.unit_id || "",
      description: assign.description || "",
      due_date: assign.due_date
        ? new Date(assign.due_date).toISOString().slice(0, 16)
        : "",
      file_url: assign.file_url || "",
    });
    setIsEditing(true);
    setEditingId(assign.id);
    setShowForm(true); // Show modal when editing
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;

    setLoading(true);
    try {
      await axiosInstance.delete(`/lecturer/assignments/${id}`);
      toast.success("Assignment deleted successfully");
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error("Failed to delete assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    resetForm();
    setShowForm(true);
  };

  if (loading && !showForm) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span className="loading-text">Loading assignments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="assignments-container">
      <div className="page-header">
        <h1 className="page-title">Assignments & Cats</h1>
        <p className="page-subtitle">
          Create assignments, track due dates, and view student submissions.
        </p>
      </div>

      {/* Create Assignment Button */}
      <button className="create-assignment-btn" onClick={handleCreateClick}>
        <FiPlus size={24} />
        Create New Assignment
      </button>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? "Edit Assignment" : "Create New Assignment"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter assignment title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  className="form-control"
                  onChange={handleUnitChange}
                  value={
                    units.find((u) => u.unit_id === formData.unit_id)?.id || ""
                  }
                >
                  <option value="">Select a unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.title} ({unit.short_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Questions</label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={handleQuillChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Type questions or instructions here..."
                  style={{ height: "200px", marginBottom: "50px" }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="datetime-local"
                    name="due_date"
                    className="form-control"
                    value={formData.due_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Assignment File</label>
                  <input
                    type="file"
                    name="file_url"
                    className="form-control"
                    onChange={handleChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-4"
              >
                {loading
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                    ? "Update Assignment"
                    : "Create Assignment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Two-column layout for Recent Assignments and Submissions */}
      <div className="grid-container">
        {/* Recent Assignments */}
        <div className="card">
          <h3>Recent Assignments</h3>
          {assignments.length > 0 ? (
            <div className="assignments-list">
              {assignments.map((assign) => (
                <div key={assign.id} className="assignment-item">
                  <div className="assignment-header">
                    <span className="assignment-title">{assign.title}</span>
                    <span className="assignment-due">
                      Due: {new Date(assign.due_date).toLocaleString()}
                    </span>
                  </div>
                  <div className="assignment-unit">
                    {assign.units?.short_code}
                  </div>
                  <div className="assignment-actions">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEdit(assign)}
                      title="Edit Assignment"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(assign.id)}
                      title="Delete Assignment"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No assignments created yet.</p>
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="card">
          <h3>Recent Submissions</h3>
          {submissions.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Assignment</th>
                    <th>Unit Title</th>
                    <th>Submitted On</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 5).map((sub) => (
                    <tr key={sub.id}>
                      <td className="font-medium text-gray-900">
                        {sub.users?.name || "Unknown"}
                      </td>
                      <td className="text-gray-500">
                        {sub.users?.student_details?.[0]?.student_id || "N/A"}
                      </td>
                      <td>{sub.assignments?.title || "Unknown Assignment"}</td>
                      <td className="text-gray-500">
                        {sub.assignments?.units?.title || "N/A"}
                      </td>
                      <td className="text-gray-500">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No submissions yet.</p>
            </div>
          )}
          {submissions.length > 5 && (
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <button className="btn-primary btn-outline">
                View All Submissions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assignments;
