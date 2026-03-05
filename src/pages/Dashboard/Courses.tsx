import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance as api } from "../../shared/index";
import toast from "react-hot-toast";
import { BookOpen, Book } from "lucide-react";
import { CourseCard } from "../../shared/index";
import "../styles/Courses.css"; // Import the CSS file

interface Course {
  id: string;
  title: string;
  short_code: string;
  description: string;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Find programs this teacher is assigned to
        const response = await api.get("/lecturer/programs");
        setCourses(response.data);
      } catch (error) {
        toast.error("Failed to load your courses");
        console.error(error);
      } finally {
        setLoading(false);
      }    
    };

    fetchCourses();
  }, []);

  const handleManageCourse = (courseId: string) => {
    navigate(`/dashboard/courses/${courseId}/units`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-container">
      <div className="courses-header">
        <BookOpen className="header-icon" />
        <div className="header-content">
          <h1 className="header-title">My Courses</h1>
          <p className="header-subtitle">
            View and manage the courses you teach
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <Book className="empty-state-icon" />
          <h3>No active courses found</h3>
          <p>
            You are not currently assigned to any active courses. Contact the
            standard administrator if this is a mistake.
          </p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card-wrapper">
              <CourseCard
                course={course}
                viewMode="teacher"
                onManage={handleManageCourse}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;
