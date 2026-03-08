// StudentManagement.tsx
import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../shared/index";
import "../styles/StudentManagement.css"; // Import the CSS file

interface Unit {
  id: string;
  unit_id: string;
  program_id: string;
  program: { id: string; title: string; short_code: string };
  title: string;
  short_code: string;
  description: string;
  semester: number;
  year: number;
}

interface Course {
  id: string;
  title: string;
  short_code: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  student_id: string;
  assignments: number;
  marked_assignments: number;
}

interface AssignmentSubmission {
  id: string;
  score: number | null;
  status: string;
  file_url: string;
  answer_text: string;
}

interface AssignmentDetail {
  id: string;
  title: string;
  description: string;
  unit: { title: string };
  submission?: AssignmentSubmission;
}

const StudentManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for details view
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [assignmentData, setAssignmentData] = useState<{
    submitted: AssignmentDetail[];
    failed: AssignmentDetail[];
  } | null>(null);
  const [markingScores, setMarkingScores] = useState<{ [key: string]: number }>({});
  const [markingLoading, setMarkingLoading] = useState<{ [key: string]: boolean }>({});
  const [progressData, setProgressData] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'assignments' | 'progress'>('assignments');
  const [progUnitId, setProgUnitId] = useState<string>("");

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await axiosInstance.get("/lecturer/units");
        const units: Unit[] = response.data;

        const courseMap = new Map<string, Course>();
        units.forEach((unit) => {
          if (unit.program && !courseMap.has(unit.program_id)) {
            courseMap.set(unit.program_id, {
              id: unit.program_id,
              title: unit.program.title,
              short_code: unit.program.short_code,
            });
          }
        });

        const uniqueCourses = Array.from(courseMap.values());
        setCourses(uniqueCourses);
        setUnits(response.data);

        if (uniqueCourses.length > 0) {
          setSelectedCourseId(uniqueCourses[0].id);
        }
      } catch (err: any) {
        console.error("Failed to fetch units/courses:", err);
        setError(err.response?.data?.error || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchUnits();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const response = await axiosInstance.get(
          `/lecturer/courses/${selectedCourseId}/students`,
        );
        setStudents(response.data);
      } catch (err: any) {
        console.error("Failed to fetch students:", err);
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedCourseId]);

  const handleViewDetails = async (student: Student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    setAssignmentData(null);
    try {
      const response = await axiosInstance.get(
        `/lecturer/students/${student.id}/course/${selectedCourseId}/assignments`
      );
      setAssignmentData(response.data);
      
      // Initialize scores from existing submissions
      const initialScores: { [key: string]: number } = {};
      response.data.submitted.forEach((a: AssignmentDetail) => {
        if (a.submission?.score !== null && a.submission?.score !== undefined) {
          initialScores[a.id] = a.submission.score;
        }
      });
      setMarkingScores(initialScores);
    } catch (err) {
      console.error("Failed to fetch assignment details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewProgress = async (unitId: string) => {
    setProgressLoading(true);
    try {
      const response = await axiosInstance.get(`/lecturer/units/${unitId}/student-progress`);
      setProgressData(response.data);
    } catch (err) {
      console.error("Failed to fetch progress data:", err);
    } finally {
      setProgressLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'progress' && progUnitId) {
      handleViewProgress(progUnitId);
    }
  }, [activeTab, progUnitId]);

  useEffect(() => {
    if (activeTab === 'progress' && !progUnitId && courses.length > 0) {
      // Find first unit available to set as default for progress
      const fetchFirstUnit = async () => {
        try {
          const res = await axiosInstance.get("/lecturer/units");
          if (res.data.length > 0) {
            setProgUnitId(res.data[0].id);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchFirstUnit();
    }
  }, [activeTab, courses]);

  const handleGrade = async (assignmentId: string, studentId: string) => {
    const score = markingScores[assignmentId];
    if (score === undefined || score < 0 || score > 30) {
      alert("Please enter a valid score between 0 and 30");
      return;
    }

    setMarkingLoading(prev => ({ ...prev, [assignmentId]: true }));
    try {
      await axiosInstance.post("/lecturer/grade-assignment", {
        assignmentId,
        studentId,
        score
      });
      
      // Refresh details
      if (selectedStudent) {
        const response = await axiosInstance.get(
          `/lecturer/students/${selectedStudent.id}/course/${selectedCourseId}/assignments`
        );
        setAssignmentData(response.data);
      }
      
      // Refresh students list to update counts
      const studentsRes = await axiosInstance.get(
        `/lecturer/courses/${selectedCourseId}/students`
      );
      setStudents(studentsRes.data);
      
      alert("Grade submitted successfully");
    } catch (err) {
      console.error("Failed to grade assignment:", err);
      alert("Failed to submit grade");
    } finally {
      setMarkingLoading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const closeDetails = () => {
    setSelectedStudent(null);
    setAssignmentData(null);
  };

  if (loading) {
    return (
      <div className="student-management">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span className="loading-text">Loading courses...</span>
        </div>
      </div>
    );
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="student-management">
      <div className="page-header">
        <h1>Student Management</h1>
        <p>View students enrolled in the courses you teach.</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {!selectedStudent ? (
        <>
          <div className="card">
            <div className="card-header">
              <h3>Select Course</h3>
            </div>
            <div className="card-body">
              <div className="course-selector">
                <label htmlFor="course-select">Course</label>
                <select
                  id="course-select"
                  className="course-select"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.short_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>
                Enrolled Students
                <span className="student-count">{students.length}</span>
              </h3>
            </div>

            <div className="card-body">
              {studentsLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <span className="loading-text">Loading students...</span>
                </div>
              ) : students.length > 0 ? (
                <div className="table-container">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Student ID</th>
                        <th>Assignments</th>
                        <th>Marked Assignment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const allMarked = student.assignments > 0 && student.marked_assignments === student.assignments;
                        const pending = student.assignments - student.marked_assignments;
                        
                        return (
                          <tr key={student.id}>
                            <td>
                              <div className="student-name">{student.name}</div>
                            </td>
                            <td>
                              <div className="student-id">{student.student_id}</div>
                            </td>
                            <td>
                              <div className="assignment-count">{student.assignments}</div>
                            </td>
                            <td>
                              <div className={`marked-status ${allMarked ? 'status-marked' : 'status-pending'}`}>
                                {allMarked ? 'marked' : `${pending} pending`}
                              </div>
                            </td>
                            <td>
                              <button 
                                className="btn-details"
                                onClick={() => handleViewDetails(student)}
                              >
                                More Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <h3>No students found</h3>
                  <p>No students are currently enrolled in this course.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="details-view">
          <div className="details-header">
            <button className="btn-back" onClick={closeDetails}>
              &larr; Back to List
            </button>
            <h2>Student Details</h2>
          </div>

          <div className="student-info-grid">
            <div className="info-card">
              <label>Name</label>
              <p>{selectedStudent.name}</p>
            </div>
            <div className="info-card">
              <label>Student ID</label>
              <p>{selectedStudent.student_id}</p>
            </div>
            <div className="info-card">
              <label>Course</label>
              <p>{selectedCourse?.title} ({selectedCourse?.short_code})</p>
            </div>
          </div>

          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}
            >
              Assignments
            </button>
            <button 
              className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('progress')}
            >
              Topic Progress
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'assignments' ? (
              <div className="assignments-section">
                <h3>Assignments</h3>
                
                {detailsLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <span className="loading-text">Loading assignments...</span>
                  </div>
                ) : (
                  <>
                    <div className="assignment-group">
                      <h4>Submitted Assignments</h4>
                      {assignmentData?.submitted.length === 0 ? (
                        <p className="no-data">No assignments submitted yet.</p>
                      ) : (
                        <div className="assignment-list">
                          {assignmentData?.submitted.map((a) => (
                            <div key={a.id} className="assignment-item">
                              <div className="assignment-info">
                                <h5>{a.title}</h5>
                                <p className="unit-name">{a.unit.title}</p>
                                {a.submission?.file_url && (
                                  <a href={a.submission.file_url} target="_blank" rel="noopener noreferrer" className="link-view">
                                    View Attachment
                                  </a>
                                )}
                                {a.submission?.answer_text && (
                                  <div className="answer-text">
                                    <strong>Submission:</strong>
                                    <p>{a.submission.answer_text}</p>
                                  </div>
                                )}
                              </div>
                              <div className="grading-action">
                                 <div className="grade-input-group">
                                   <label>Award Marks (0-30)</label>
                                   <input 
                                     type="number" 
                                     min="0" 
                                     max="30"
                                     value={markingScores[a.id] ?? ""}
                                     onChange={(e) => setMarkingScores({...markingScores, [a.id]: parseInt(e.target.value)})}
                                     placeholder="Score"
                                   />
                                 </div>
                                 <button 
                                   className="btn-grade"
                                   disabled={markingLoading[a.id]}
                                   onClick={() => handleGrade(a.id, selectedStudent.id)}
                                 >
                                   {markingLoading[a.id] ? "Saving..." : "Save Marks"}
                                 </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="assignment-group">
                      <h4>Failed to Submit</h4>
                      {assignmentData?.failed.length === 0 ? (
                        <p className="no-data">All assignments have a submission.</p>
                      ) : (
                        <div className="assignment-list">
                          {assignmentData?.failed.map((a) => (
                            <div key={a.id} className="assignment-item failed-item">
                              <div className="assignment-info">
                                <h5>{a.title}</h5>
                                <p className="unit-name">{a.unit.title}</p>
                                <span className="status-badge-failed">Not Submitted</span>
                              </div>
                              <div className="grading-action">
                                 <div className="grade-input-group">
                                   <label>Record Marks</label>
                                   <input 
                                     type="number" 
                                     min="0" 
                                     max="30"
                                     value={markingScores[a.id] ?? ""}
                                     onChange={(e) => setMarkingScores({...markingScores, [a.id]: parseInt(e.target.value)})}
                                     placeholder="0"
                                   />
                                 </div>
                                 <button 
                                   className="btn-grade btn-failed-grade"
                                   disabled={markingLoading[a.id]}
                                   onClick={() => handleGrade(a.id, selectedStudent.id)}
                                 >
                                   {markingLoading[a.id] ? "Saving..." : "Record 0"}
                                 </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="progress-section">
                <div className="section-header">
                  <h3>Topic Completion</h3>
                  <div className="unit-selector-mini">
                    <label>Select Unit:</label>
                    <select 
                      value={progUnitId} 
                      onChange={(e) => setProgUnitId(e.target.value)}
                      className="course-select"
                    >
                      <option value="">-- Select Unit --</option>
                      {units.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {progressLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <span className="loading-text">Loading progress...</span>
                  </div>
                ) : progressData.length > 0 ? (
                  <div className="table-container">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>ID</th>
                          <th>Completed Topics</th>
                          <th>Assignments Completed</th>
                          <th>Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progressData.map((p) => (
                          <tr key={p.id}>
                            <td>{p.name}</td>
                            <td><span className="student-id">{p.student_id}</span></td>
                            <td>{p.completedTopics} / {p.totalTopics}</td>
                            <td>{p.completedAssignments} / {p.totalAssignments}</td>
                            <td>
                              <div className="progress-cell">
                                <div className="progress-bar-container">
                                  <div 
                                    className="progress-bar-fill" 
                                    style={{ width: `${p.progressPercentage}%` }}
                                  ></div>
                                </div>
                                <span className="progress-percent">{p.progressPercentage}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No enrollment data found for this unit.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
