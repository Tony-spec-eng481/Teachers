import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Clock, Award } from 'lucide-react';
import '../styles/components/CourseCard.css';

interface CourseProps {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category?: string;
  lessons_count?: number;   
  students_count?: number;
  instructor_name?: string;
  is_published?: boolean;
}

interface CourseCardProps {
  course: CourseProps;
  viewMode?: 'student' | 'teacher' | 'admin';
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onManage?: (id: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, viewMode = 'student', onManage }) => {
  const {
    id,
    title,
    description,
    thumbnail,
    category,
    lessons_count = 0,
    students_count = 0,
  } = course;

  return (
    <div className="course-card-component">
      {/* <div className="course-card-image-wrap">
        <img 
          src={thumbnail || '/api/placeholder/400/225'} 
          alt={title} 
          className="course-card-image"
        />
        {category && <span className="course-card-badge">{category}</span>}
      </div> */}
      
      <div className="course-card-body">
        <h3 className="course-card-title">{title}</h3>
        <p className="course-card-description">{description}</p>
        
        <div className="course-card-footer">
          <div className="course-card-stats">
            <span className="course-stat">
              <BookOpen size={16} />
              {lessons_count} Lessons
            </span>
            <span className="course-stat">
              <Users size={16} />
              {students_count} Students
            </span>
          </div>

          {viewMode === 'student' && (
            <Link to={`/courses/${id}`} className="course-card-btn">
              View Course Details
            </Link>
          )}
          
          {viewMode === 'teacher' && (
             <button 
              onClick={() => onManage?.(id)}
              className="course-card-btn"
              style={{ width: '100%', border: 'none', cursor: 'pointer' }}
            >
              Manage Course
            </button>
          )}

          {/* {viewMode === 'admin' && (
             <Link to={`/admin/courses/${id}`} className="course-card-btn">
              System Review
            </Link>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
