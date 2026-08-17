import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Board from './pages/Board';
import SuggestionForm from './pages/SuggestionForm';
import MaintenanceBoard from './pages/MaintenanceBoard';
import SecretariaPanel from './pages/SecretariaPanel';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';

// Componente para proteger rutas privadas
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Protección por Roles Institucionales
function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const isAllowed = allowedRoles.some(r => 
    r === user.rol || 
    (r === 'administrador' && user.rol === 'admin') || 
    (r === 'admin' && user.rol === 'administrador')
  );

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Ruta exclusiva para invitados (si ya está logueado, redirigir al tablero)
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
            {/* Rutas públicas de acceso */}
            <Route 
              path="/login" 
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              } 
            />

            {/* Rutas autenticadas dentro del Layout principal */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* 1. Tablero Público de Sugerencias (Todos los roles) */}
              <Route index element={<Board />} />
              
              {/* 2. Formulario para enviar propuestas */}
              <Route 
                path="nueva-sugerencia" 
                element={
                  <RoleRoute allowedRoles={['alumno', 'profesor', 'administrador', 'admin']}>
                    <SuggestionForm />
                  </RoleRoute>
                } 
              />

              {/* 3. Tablón de Tareas de Mantenimiento (Mantenimiento y Administrador) */}
              <Route 
                path="mantenimiento" 
                element={
                  <RoleRoute allowedRoles={['mantenimiento', 'administrador', 'admin']}>
                    <MaintenanceBoard />
                  </RoleRoute>
                } 
              />

              {/* 4. Panel de Nóminas de Secretaría (Secretaría y Administrador) */}
              <Route 
                path="secretaria" 
                element={
                  <RoleRoute allowedRoles={['secretaria', 'administrador', 'admin']}>
                    <SecretariaPanel />
                  </RoleRoute>
                } 
              />
              
              {/* 5. Panel de Moderación y Respuestas Oficiales (Profesor y Administrador) */}
              <Route 
                path="admin" 
                element={
                  <RoleRoute allowedRoles={['profesor', 'administrador', 'admin']}>
                    <Dashboard />
                  </RoleRoute>
                } 
              />

              {/* 6. Perfil de Usuario (Todos los roles) */}
              <Route path="perfil" element={<Profile />} />
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
