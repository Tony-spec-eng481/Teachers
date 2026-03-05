
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './shared/context/AuthContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { Analytics } from '@vercel/analytics/react';

import { lazy, Suspense } from 'react';

// Pages
const TeacherHome = lazy(() => import('./teacher-home'));
const TeacherLogin = lazy(() => import('./auth/login'));
const TeacherRegister = lazy(() => import('./auth/register'));
const ForgotPassword = lazy(() => import('./shared/index').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./shared/index').then(m => ({ default: m.ResetPassword })));
const TeacherDashboard = lazy(() => import('./pages/Dashboard/TeacherDashboard'));
const Overview = lazy(() => import('./pages/Dashboard/Overview'));
const StudentManagement = lazy(() => import('./pages/Dashboard/StudentManagement'));
const ContentManagement = lazy(() => import('./pages/Dashboard/ContentManagement'));
const LiveClasses = lazy(() => import('./pages/Dashboard/LiveClasses'));
const Assignments = lazy(() => import('./pages/Dashboard/Assignments'));
const Courses = lazy(() => import('./pages/Dashboard/Courses'));
const CourseUnits = lazy(() => import('./pages/Dashboard/CourseUnits'));
const Announcements = lazy(() => import('./pages/Dashboard/Announcements'));
const AgoraClass = lazy(() => import('./pages/Dashboard/AgoraClass'));
const Profile = lazy(() => import('./pages/Dashboard/Profile'));

import SEO from './shared/components/SEO';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <Routes>
          <Route path="/" element={<><SEO title="Teacher Portal" description="Manage your courses and interact with students on the Elimu Teacher Portal." /><TeacherHome /></>} />
          <Route path="/auth/login" element={<><SEO title="Teacher Login" noindex /><TeacherLogin /></>} />
          <Route path="/auth/register" element={<><SEO title="Teacher Register" noindex /><TeacherRegister /></>} />
          <Route path="/auth/forgot-password" element={<><SEO title="Forgot Password" noindex /><ForgotPassword /></>} />
          <Route path="/auth/reset-password" element={<><SEO title="Reset Password" noindex /><ResetPassword /></>} />

          <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
            <Route path="/dashboard" element={<><SEO title="Teacher Dashboard" noindex /><TeacherDashboard /></>}>
              <Route index element={<Overview />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:id/units" element={<CourseUnits />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="live-classes" element={<LiveClasses />} />
              <Route path="live-classes/room/:channelName" element={<AgoraClass />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      <Analytics />
    </AuthProvider>
  );  
}

export default App;
