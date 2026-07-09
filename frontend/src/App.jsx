import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Board from './pages/Board';
import SuggestionForm from './pages/SuggestionForm';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Role-based Route Protection
function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Guest-only Route (Redirect to home if logged in)
function GuestRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Guest-only routes */}
            <Route 
              path="/login" 
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              } 
            />

            {/* Authenticated routes inside Layout */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Main Suggestions Board */}
              <Route index element={<Board />} />
              
              {/* Form to submit new suggestions (Only Alumnos & Admins) */}
              <Route 
                path="nueva-sugerencia" 
                element={
                  <RoleRoute allowedRoles={['alumno', 'administrador']}>
                    <SuggestionForm />
                  </RoleRoute>
                } 
              />
              
              {/* Administration/Management Dashboard (Only Profesor & Administrador) */}
              <Route 
                path="admin" 
                element={
                  <RoleRoute allowedRoles={['profesor', 'administrador']}>
                    <Dashboard />
                  </RoleRoute>
                } 
              />

              {/* User Profile Page (All Roles) */}
              <Route path="perfil" element={<Profile />} />
            </Route>

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
