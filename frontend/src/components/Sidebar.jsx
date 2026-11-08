import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  FileSpreadsheet, 
  ShieldCheck, 
  User, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  if (!user) return null;

  const isAdmin = user.rol === 'administrador' || user.rol === 'admin';
  const isProfesor = user.rol === 'profesor';
  const isAlumno = user.rol === 'alumno';
  const isSecretaria = user.rol === 'secretaria';

  return (
    <>
      {/* Mobile Top Navbar (solo visible en pantallas móviles) */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileBrand}>
          <img src={logoImg} alt="Logo" className={styles.mobileLogo} />
          <div>
            <div className={styles.mobileTitle}>MONTEPIEDRA</div>
            <div className={styles.mobileSubtitle}>Buzón</div>
          </div>
        </div>
        <div className={styles.mobileActions}>
          <button className={styles.hamburger} onClick={toggleSidebar} aria-label="Menú">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar Container */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Brand Header */}
        <div className={styles.brand}>
          <img src={logoImg} alt="Logo Montepiedra" className={styles.logo} />
          <div className={styles.brandText}>
            <span className={styles.title}>MONTEPIEDRA</span>
            <span className={styles.subtitle}>Buzón Institucional</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {/* 1. Tablero Público (Para todos los roles) */}
            <li>
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                onClick={closeSidebar}
                end
              >
                <LayoutDashboard size={18} className={styles.linkIcon} />
                <span>Tablero Público</span>
              </NavLink>
            </li>

            {/* 2. Enviar Sugerencia (Alumnos, Profesores y Administradores) */}
            {(isAlumno || isProfesor || isAdmin) && (
              <li>
                <NavLink 
                  to="/nueva-sugerencia" 
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                  onClick={closeSidebar}
                >
                  <FileText size={18} className={styles.linkIcon} />
                  <span>Enviar Sugerencia</span>
                </NavLink>
              </li>
            )}

            {/* 3. Panel de Nóminas (Rol Secretaría y Administradores) */}
            {(isSecretaria || isAdmin) && (
              <li>
                <NavLink 
                  to="/secretaria" 
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                  onClick={closeSidebar}
                >
                  <FileSpreadsheet size={18} className={styles.linkIcon} />
                  <span>Gestión de Nóminas</span>
                </NavLink>
              </li>
            )}

            {/* 4. Panel de Gestión y Moderación (Profesores y Administradores) */}
            {(isProfesor || isAdmin) && (
              <li>
                <NavLink 
                  to="/admin" 
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                  onClick={closeSidebar}
                >
                  <ShieldCheck size={18} className={styles.linkIcon} />
                  <span>Panel de Moderación</span>
                </NavLink>
              </li>
            )}

            {/* 5. Perfil de Usuario (Para todos los roles) */}
            <li>
              <NavLink 
                to="/perfil" 
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
                onClick={closeSidebar}
              >
                <User size={18} className={styles.linkIcon} />
                <span>Mi Perfil</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} className={styles.logoutIcon} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay móvil */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar} />}
    </>
  );
}
