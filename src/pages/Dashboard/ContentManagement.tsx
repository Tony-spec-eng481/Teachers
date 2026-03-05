// ContentManagement.tsx
import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../shared/index";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Film,
  FileText,
  Headphones,
  AlignLeft,
  X,
  Save,
} from "lucide-react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import "../styles/ContentManagement.css";


interface Unit {
  id: string;
  unit_id: string;
  title: string;
  short_code: string;
  program_id?: string;
  program?: {
    title: string;
  };
}

interface Topic {
  id: string;
  unit_id: string;
  title: string;
  content_type: "video" | "document" | "audio" | "text";
  sequence_number: number;
  notes?: string;
  video_url?: string;
  audio_intro_url?: string;
  notes_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormData {
  unit_id: string;
  title: string;
  content_type: "video" | "document" | "audio" | "text";
  sequence_number: number;
  notes: string;
  video_url: string | File;
  audio_intro_url: string | File;
  notes_url: string | File;
}

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


const ContentManagement = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  // Form state
  const [formData, setFormData] = useState<FormData>({
    unit_id: "",
    title: "",
    content_type: "video",
    sequence_number: 1,
    notes: "",
    video_url: "",
    audio_intro_url: "",
    notes_url: "",
  });

  // Fetch units on mount
  useEffect(() => {
    fetchUnits();
  }, []);

  // Fetch topics when selected unit changes
  useEffect(() => {
    if (selectedUnitId) {
      fetchTopics(selectedUnitId);
    }
  }, [selectedUnitId]);

  const fetchUnits = async () => {
    try {
      const response = await axiosInstance.get("/lecturer/units");
      setUnits(response.data);
      if (response.data.length > 0) {
        setSelectedUnitId(response.data[0].id);
        setFormData((prev) => ({ ...prev, unit_id: response.data[0].id }));
      }
    } catch (error) {
      toast.error("Failed to load units");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (unitId: string) => {
    setTopicsLoading(true);
    try {
      const response = await axiosInstance.get(`/lecturer/topics/${unitId}`);
      setTopics(response.data);
    } catch (error) {
      toast.error("Failed to load topics");
      console.error(error);
    } finally {
      setTopicsLoading(false);
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unitId = e.target.value;
    setSelectedUnitId(unitId);
    setFormData((prev) => ({ ...prev, unit_id: unitId }));
    setShowForm(false);
    setEditingTopic(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value, type } = target;
    
    if (type === 'file') {

      const fileBatch = (e.target as HTMLInputElement).files;
      if (fileBatch && fileBatch.length > 0) {
        setFormData((prev) => ({
          ...prev,
          [name]: fileBatch[0],
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "sequence_number" ? parseInt(value) || 1 : value,
      }));
    }
  };

  const handleQuillChange = (content: string) => {
    setFormData(prev => ({ ...prev, notes: content }));
  };


  const resetForm = () => {
    setFormData({
      unit_id: selectedUnitId,
      title: "",
      content_type: "video",
      sequence_number: topics.length + 1,
      notes: "",
      video_url: "",
      audio_intro_url: "",
      notes_url: "",
    });
    setEditingTopic(null);
    setShowForm(false);
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      unit_id: topic.unit_id,
      title: topic.title,
      content_type: topic.content_type,
      sequence_number: topic.sequence_number,
      notes: topic.notes || "",
      video_url: topic.video_url || "",
      audio_intro_url: topic.audio_intro_url || "",
      notes_url: topic.notes_url || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (!formData.unit_id) {
      toast.error("Please select a unit");
      return;
    }

    try {
      if (editingTopic) {
        // Update existing topic
        const data = new FormData();
        data.append('unit_id', formData.unit_id);
        data.append('title', formData.title);
        data.append('content_type', formData.content_type);
        data.append('sequence_number', formData.sequence_number.toString());
        data.append('notes', formData.notes);
        
        if (formData.video_url instanceof File) data.append('video', formData.video_url);
        if (formData.audio_intro_url instanceof File) data.append('audio', formData.audio_intro_url);
        if (formData.notes_url instanceof File) data.append('document', formData.notes_url);

        await axiosInstance.patch(
          `/lecturer/topics/${editingTopic.id}`,
          data,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        toast.success("Topic updated successfully");
      } else {
        // Create new topic
        const data = new FormData();
        data.append('unit_id', formData.unit_id);
        data.append('title', formData.title);
        data.append('content_type', formData.content_type);
        data.append('sequence_number', formData.sequence_number.toString());
        data.append('notes', formData.notes);
        
        if (formData.video_url instanceof File) data.append('video', formData.video_url);
        if (formData.audio_intro_url instanceof File) data.append('audio', formData.audio_intro_url);
        if (formData.notes_url instanceof File) data.append('document', formData.notes_url);

        await axiosInstance.post("/lecturer/topics", data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Topic created successfully");
      }


      // Refresh topics
      await fetchTopics(selectedUnitId);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save topic");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (topicId: string) => {
    if (!window.confirm("Are you sure you want to delete this topic?")) return;

    try {
      await axiosInstance.delete(`/lecturer/topics/${topicId}`);
      toast.success("Topic deleted successfully");
      setTopics(topics.filter((t) => t.id !== topicId));
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete topic");
    }
  };

  const moveTopic = async (topicId: string, direction: "up" | "down") => {
    const currentIndex = topics.findIndex((t) => t.id === topicId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === topics.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const updatedTopics = [...topics];
    [updatedTopics[currentIndex], updatedTopics[newIndex]] = [
      updatedTopics[newIndex],
      updatedTopics[currentIndex],
    ];

    // Update sequence numbers
    updatedTopics.forEach((topic, index) => {
      topic.sequence_number = index + 1;
    });

    setTopics(updatedTopics);

    // TODO: Call API to update sequence numbers
    // This would require a batch update endpoint
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Film size={16} />;
      case "document":
        return <FileText size={16} />;
      case "audio":
        return <Headphones size={16} />;
      case "text":
        return <AlignLeft size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "#0059ff";
      case "document":
        return "#10b981";
      case "audio":
        return "#f59e0b";
      case "text":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="content-management">
      <div className="content-header">
        <h1>Content Management</h1>
        <p>Manage topics, videos, and documents for your units</p>
      </div>

      {/* Unit Selection */}
      <div className="unit-selector-card">
        <div className="unit-selector">
          <label htmlFor="unit-select">Select Unit</label>
          <select
            id="unit-select"
            value={selectedUnitId}
            onChange={handleUnitChange}
            className="unit-select"
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.title} ({unit.short_code})
                {unit.program?.title && ` - ${unit.program.title}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Topics List */}
        <div className="topics-panel">
          <div className="panel-header">
            <h2>Topics</h2>
            <button
              className="btn-primary"
              style={{ width: "200px" }}
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  sequence_number: topics.length + 1,
                }));
                setShowForm(true);
                setEditingTopic(null);
              }}
            >
              <Plus size={18} />
              Add Topic
            </button>
          </div>

          <div className="topics-list">
            {topicsLoading ? (
              <div className="loading-state">Loading topics...</div>
            ) : topics.length === 0 ? (
              <div className="empty-state">
                <p>No topics found for this unit</p>
                <button
                  className="btn-outline"
                  onClick={() => setShowForm(true)}
                >
                  Create your first topic
                </button>
              </div>
            ) : (
              topics
                .sort((a, b) => a.sequence_number - b.sequence_number)
                .map((topic) => (
                  <div key={topic.id} className="topic-item">
                    <div className="topic-content">
                      <div className="topic-header">
                        <span className="topic-sequence">
                          #{topic.sequence_number}
                        </span>
                        <h3 className="topic-title">{topic.title}</h3>
                        <span
                          className="topic-type-badge"
                          style={{
                            backgroundColor: `${getContentTypeColor(topic.content_type)}15`,
                            color: getContentTypeColor(topic.content_type),
                          }}
                        >
                          {getContentTypeIcon(topic.content_type)}
                          <span>{topic.content_type}</span>
                        </span>
                      </div>

                      {topic.notes && (
                        <p className="topic-description">
                          {topic.notes.substring(0, 100)}...
                        </p>
                      )}

                      <div className="topic-resources">
                        {topic.video_url && (
                          <span className="resource-tag">
                            <Film size={12} /> Video
                          </span>
                        )}
                        {topic.notes_url && (
                          <span className="resource-tag">
                            <FileText size={12} /> Document
                          </span>
                        )}
                        {topic.audio_intro_url && (
                          <span className="resource-tag">
                            <Headphones size={12} /> Audio
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="topic-actions">
                      <button
                        className="move-btn"
                        onClick={() => moveTopic(topic.id, "up")}
                        disabled={topic.sequence_number === 1}
                      >
                        <ChevronUp size={18} />
                      </button>
                      <button
                        className="move-btn"
                        onClick={() => moveTopic(topic.id, "down")}
                        disabled={topic.sequence_number === topics.length}
                      >
                        <ChevronDown size={18} />
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(topic)}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(topic.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Topic Form Panel */}
        {showForm && (
          <div className="form-panel">
            <div className="panel-header">
              <h2>{editingTopic ? "Edit Topic" : "Create New Topic"}</h2>
              <button className="close-btn" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="topic-form">
              {/* Unit Selection in Form */}
              <div className="form-group">
                <label htmlFor="form-unit">Unit *</label>
                <select
                  id="form-unit"
                  name="unit_id"
                  value={formData.unit_id}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingTopic}
                >
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.title} ({unit.short_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter topic title"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="content_type">Content Type *</label>
                  <select
                    id="content_type"
                    name="content_type"
                    value={formData.content_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="audio">Audio</option>
                    <option value="text">Text/Notes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="sequence_number">Sequence *</label>
                  <input
                    type="number"
                    id="sequence_number"
                    name="sequence_number"
                    value={formData.sequence_number}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="video">Upload Video</label>
                <input
                  type="file"
                  id="video"
                  name="video_url"
                  onChange={handleInputChange}
                  accept="video/*"
                />
                {typeof formData.video_url === 'string' && formData.video_url && (
                  <p className="file-current">Current: {formData.video_url.split('/').pop()}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="document">Upload Document (PDF)</label>
                <input
                  type="file"
                  id="document"
                  name="notes_url"
                  onChange={handleInputChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                {typeof formData.notes_url === 'string' && formData.notes_url && (
                  <p className="file-current">Current: {formData.notes_url.split('/').pop()}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="audio">Upload Audio Intro</label>
                <input
                  type="file"
                  id="audio"
                  name="audio_intro_url"
                  onChange={handleInputChange}
                  accept="audio/*"
                />
                {typeof formData.audio_intro_url === 'string' && formData.audio_intro_url && (
                  <p className="file-current">Current: {formData.audio_intro_url.split('/').pop()}</p>
                )}
              </div>

              {/* <div className="form-group">
                <label htmlFor="notes">Notes / Description</label>
                <ReactQuill
                  theme="snow"
                  value={formData.notes}
                  onChange={handleQuillChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Enter topic notes or description"
                  style={{ height: '300px', marginBottom: '50px' }}
                />
              </div> */}


              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={18} />
                  {submitting ? "Creating Topic…" : "Create Topic"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentManagement;
