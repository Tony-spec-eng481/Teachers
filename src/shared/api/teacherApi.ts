import api from './axios';

export const teacherApi = {
  getOverview: () => api.get('/lecturer/overview'),
  getUnits: () => api.get('/lecturer/units'),
  getPrograms: () => api.get('/lecturer/programs'),
  getTopicsByUnit: (unitId: string) => api.get(`/lecturer/topics/${unitId}`),
  createTopic: (data: any) => api.post('/lecturer/topics', data),
  updateTopic: (id: string, data: any) => api.patch(`/lecturer/topics/${id}`, data),
  deleteTopic: (id: string) => api.delete(`/lecturer/topics/${id}`),
  getAssignments: () => api.get('/lecturer/assignments'),
  createAssignment: (data: any) => api.post('/lecturer/assignments', data),
  updateAssignment: (id: string, data: any) => api.patch(`/lecturer/assignments/${id}`, data),
  deleteAssignment: (id: string) => api.delete(`/lecturer/assignments/${id}`),
  getSubmissions: (params?: { unitId?: string }) => api.get('/lecturer/submissions', { params }),
  gradeAssignment: (data: { assignmentId: string, studentId: string, score: number }) => 
    api.post('/lecturer/grade-assignment', data),
  getStudentsByCourse: (courseId: string) => api.get(`/lecturer/courses/${courseId}/students`),
  getStudentAssignmentDetails: (studentId: string, courseId: string) => 
    api.get(`/lecturer/students/${studentId}/course/${courseId}/assignments`),
  getLiveClasses: () => api.get('/lecturer/live-classes'),
  updateProfile: (data: any) => api.patch('/lecturer/update-teacher-profile', data),
  getProfile: () => api.get('/lecturer/profile'),

  // New features
  getStudentProgress: (unitId: string) => api.get(`/lecturer/units/${unitId}/student-progress`),
};
