import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import './Pages.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role);
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fadeIn">
        <div className="login-header">
          <img src={logoImg} alt="Logo Montepiedra" className="login-logo" />
          <h1 className="login-title">MONTEPIEDRA</h1>
          <p className="login-subtitle">Buzón de Sugerencias Institucional</p>
        </div>
        
        <p className="login-instruction">
          Seleccione un rol de prueba para simular el inicio de sesión:
        </p>

        <div className="login-buttons">
          <button 
            onClick={() => handleLogin('alumno')} 
            className="login-btn btn-alumno"
          >
            <div className="btn-icon">🎓</div>
            <div className="btn-text-content">
              <span className="btn-title">Entrar como Alumno</span>
              <span className="btn-desc">Carlos Mendoza (2do de Bachillerato)</span>
            </div>
          </button>

          <button 
            onClick={() => handleLogin('profesor')} 
            className="login-btn btn-profesor"
          >
            <div className="btn-icon">👨‍🏫</div>
            <div className="btn-text-content">
              <span className="btn-title">Entrar como Profesor</span>
              <span className="btn-desc">Dr. Gabriel Villalba (Subdirector)</span>
            </div>
          </button>

          <button 
            onClick={() => handleLogin('administrador')} 
            className="login-btn btn-admin"
          >
            <div className="btn-icon">🛡️</div>
            <div className="btn-text-content">
              <span className="btn-title">Entrar como Administrador</span>
              <span className="btn-desc">Ing. Mauricio Ramos (Coordinador TI)</span>
            </div>
          </button>
        </div>

        <div className="login-footer">
          <span>Unidad Educativa Montepiedra &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
