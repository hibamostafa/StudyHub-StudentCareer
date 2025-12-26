import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Registar from './pages/Registar'
import SignIn from './pages/SignIn'
import HomePage from './pages/HomePage'
import Courses from './pages/Courses'
import Jobs from './pages/jobs'
import Ai from './pages/ai'
import Apply from './pages/Apply'
import ProfilePage from './pages/ProfilePage'
import ConfirmationPage from './pages/ConfirmationPage'
import AddCourse from './pages/AddCourse'
import AddExercises from './pages/AddExercises'
import EditCourse from './pages/EditCourse'
import Applicants from './pages/Applicants'
function ProtectedRoute({ children, requiredRole }: { children: JSX.Element; requiredRole?: string} ) {
  const userString = localStorage.getItem('user')
  const user = userString ? JSON.parse(userString) : null

  if (!user) return <Navigate to="/signin" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/homepage" replace />
  }

  return children
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Registar />} />
        <Route path="/" element={<SignIn />} />

        <Route path="/homepage" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><Ai /></ProtectedRoute>} />
        <Route path="/apply/:jobId" element={<ProtectedRoute><Apply /></ProtectedRoute>} />
        <Route path="/confirmation" element={<ProtectedRoute><ConfirmationPage /></ProtectedRoute>} />

        <Route path="/add-course" element={<ProtectedRoute requiredRole="Coordinator"><AddCourse /></ProtectedRoute>} />
        <Route path="/edit-course" element={<ProtectedRoute requiredRole="Coordinator"><EditCourse /></ProtectedRoute>} />
        <Route path="/applicants" element={<ProtectedRoute requiredRole="Coordinator"><Applicants /></ProtectedRoute>} />
        <Route path="/addExercises" element={<ProtectedRoute requiredRole="Coordinator"><AddExercises /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)