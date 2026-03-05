import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance as api } from "../../shared/index";
import toast from "react-hot-toast";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";
import "../styles/CourseUnits.css"; // Import the CSS file

interface Unit {
  id: string; // From the link table or regular table
  unit_id: string; // ID of the unit in the units table
  title: string;
  short_code: string;
  description: string;
  semester: number;
  year: number;
  topics?: any[];
}

const CourseUnits = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseAndUnits = async () => {
      try {
        // Fetch course details
        const courseRes = await api.get(`/courses/${courseId}`);
        setCourse(courseRes.data);

        // Fetch teacher's units for this course
        // Using the general units by course endpoint for now,
        // as teachers can view content related to their courses
        const unitsRes = await api.get(`/units/course/${courseId}`);
        setUnits(unitsRes.data);
      } catch (error) {
        toast.error("Failed to load units for this course");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseAndUnits();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading course details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-units-container">
      <div className="header-section">
        <button
          onClick={() => navigate("/dashboard/courses")}
          className="back-button"
          aria-label="Go back to courses"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="header-content">
          <h1 className="header-title">{course?.title || "Course"} Units</h1>
          <p className="header-subtitle">
            View the units assigned to this program
          </p>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <h3>No Units Found</h3>
          <p>There are currently no units available for this course.</p>
        </div>
      ) : (  
        <div className="units-grid">
          {units.map((unit) => (
            <div key={unit.id} className="unit-card">
              <div className="unit-card-content">
                <div className="unit-header">
                  <span className="unit-code">{unit.short_code}</span>
                  <span className="unit-semester">
                    Year {unit.year} • Semester {unit.semester}
                  </span>
                </div>
                <h3 className="unit-title">{unit.title}</h3>
                <p className="unit-description">{unit.description}</p>
              </div>
              <div className="unit-footer">
                <div className="unit-topics">
                  <Layers size={16} />
                  <span>Topics</span>
                  <span className="unit-topics-count">
                    {unit.topics?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseUnits;
