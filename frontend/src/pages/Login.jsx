import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEcuadorianCedula } from '../utils/api';
import logoImg from '../assets/logo.png';
import './Pages.css';

export default function Login() {
  const { validateCedula, setupPassword, loginWithPassword } = useAuth();
  const navigate = useNavigate();

  // Estados del flujo de autenticación: 'cedula' -> 'password' o 'setup_password'
  const [step, setStep] = useState('cedula'); 
  const [cedula, setCedula] = useState('');
  const [cedulaError, setCedulaError] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [keepCedula, setKeepCedula] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Lista de credenciales de prueba para facilitar evaluación
  const testAccounts = [
    { role: 'Alumno', name: 'Daniel Mendoza', cedula: '0923456781', email: 'daniel@alumno.montepiedra.edu.ec', icon: '🎓' },
    { role: 'Administrador', name: 'Ing. Mauricio Ramos', cedula: '0911223344', email: 'admin@montepiedra.edu.ec', icon: '🛡️' },
    { role: 'Profesor', name: 'Dr. Gabriel Villalba', cedula: '0955667788', email: 'profesor@montepiedra.edu.ec', icon: '👨‍🏫' },
    { role: 'Mantenimiento', name: 'Sr. Roberto Gómez', cedula: '0933445566', email: 'mantenimiento@montepiedra.edu.ec', icon: '🔨' },
    { role: 'Secretaría', name: 'Lcda. Patricia Salinas', cedula: '0944556677', email: 'secretaria@montepiedra.edu.ec', icon: '📑' }
  ];

  // Manejador de cambio en input de Cédula
  const handleCedulaInputChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setCedula(clean);
    setErrorMsg('');

    if (clean.length > 0) {
      const validation = validateEcuadorianCedula(clean);
      if (!validation.isValid) {
        setCedulaError(validation.message);
      } else {
        setCedulaError('');
      }
    } else {
      setCedulaError('');
    }
  };

  // Paso 1: Validar Número de Cédula
  const handleCedulaSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanCedula = cedula.trim();

    const validation = validateEcuadorianCedula(cleanCedula);
    if (!validation.isValid) {
      setCedulaError(validation.message);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = validateCedula(cleanCedula);
      setLoading(false);

      if (!result.exists) {
        setErrorMsg('La cédula ingresada no se encuentra registrada en la nómina institucional.');
        return;
      }

      setCurrentUser(result.user);

      if (result.isFirstLogin) {
        // Redirigir a vista de Configurar Contraseña para primer ingreso
        setStep('setup_password');
      } else {
        // Usuario ya configurado: pedir contraseña
        setStep('password');
      }
    }, 300);
  };


  // Paso 2A: Configuración de contraseña (Primer ingreso)
  const handleSetupPasswordSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!keepCedula) {
      if (!newPassword || newPassword.length < 4) {
        setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden. Por favor verifíquelas.');
        return;
      }
    }

    setLoading(true);
    const result = setupPassword(currentUser.cedula, newPassword, keepCedula);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setErrorMsg(result.error || 'Error al configurar la contraseña.');
    }
  };

  // Paso 2B: Iniciar sesión con contraseña
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setErrorMsg('Por favor ingrese su contraseña.');
      return;
    }

    setLoading(true);
    const result = loginWithPassword(currentUser.cedula, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setErrorMsg(result.error || 'Contraseña incorrecta.');
    }
  };

  const handleSelectTestAccount = (testCedula) => {
    setCedula(testCedula);
    setErrorMsg('');
    setStep('cedula');
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fadeIn">
        {/* Cabecera Institucional */}
        <div className="login-header">
          <img src={logoImg} alt="Logo Montepiedra" className="login-logo" />
          <h1 className="login-title">MONTEPIEDRA</h1>
          <p className="login-subtitle">Buzón de Sugerencias Institucional</p>
        </div>

        {errorMsg && (
          <div className="alert-banner alert-error animate-fadeIn">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PASO 1: Ingreso de Cédula */}
        {step === 'cedula' && (
          <form onSubmit={handleCedulaSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="cedula-input">
                Número de Cédula de Identidad
              </label>
              <div className="input-icon-wrapper">
                <span className="input-prefix-icon">🪪</span>
                <input
                  id="cedula-input"
                  type="text"
                  placeholder="Ej. 0923456781"
                  value={cedula}
                  onChange={(e) => handleCedulaInputChange(e.target.value)}
                  maxLength={10}
                  required
                  autoFocus
                  className={`login-input ${cedulaError ? 'input-invalid' : ''}`}
                />
              </div>
              {cedulaError ? (
                <p className="input-error-msg">⚠️ {cedulaError}</p>
              ) : (
                <p className="form-help">
                  Ingresa tu número de cédula ecuatoriana de 10 dígitos (provincia 01-24) registrado en secretaría.
                </p>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary login-submit-btn" 
              disabled={loading || Boolean(cedulaError) || !cedula}
            >
              {loading ? 'Validando Cédula...' : 'Continuar ➔'}
            </button>
          </form>
        )}


        {/* PASO 2A: Configuración de Contraseña (Primer Ingreso) */}
        {step === 'setup_password' && currentUser && (
          <form onSubmit={handleSetupPasswordSubmit} className="login-form animate-fadeIn">
            <div className="first-login-banner">
              <div className="user-avatar-badge">
                <img src={currentUser.avatar} alt="Avatar" className="setup-avatar" />
                <div>
                  <h3 className="setup-user-name">¡Bienvenido(a), {currentUser.nombre}!</h3>
                  <span className={`badge-role-pill role-${currentUser.rol}`}>
                    {currentUser.rol.toUpperCase()} • {currentUser.correo}
                  </span>
                </div>
              </div>
              <p className="setup-instructions">
                ✨ Este es tu <strong>primer ingreso al sistema</strong>. Elige cómo deseas proteger tu cuenta institucional:
              </p>
            </div>

            <div className="setup-options-group">
              <label className={`setup-option-card ${keepCedula ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="passwordChoice" 
                  checked={keepCedula} 
                  onChange={() => setKeepCedula(true)} 
                />
                <div className="option-text">
                  <strong>Mantener mi cédula como contraseña</strong>
                  <span>Tu contraseña predeterminada será tu número de cédula ({currentUser.cedula}).</span>
                </div>
              </label>

              <label className={`setup-option-card ${!keepCedula ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="passwordChoice" 
                  checked={!keepCedula} 
                  onChange={() => setKeepCedula(false)} 
                />
                <div className="option-text">
                  <strong>Crear una nueva contraseña personalizada</strong>
                  <span>Establece una clave secreta segura para tus próximos accesos.</span>
                </div>
              </label>
            </div>

            {!keepCedula && (
              <div className="custom-password-inputs animate-fadeIn">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-pass">Nueva Contraseña</label>
                  <input
                    id="new-pass"
                    type="password"
                    placeholder="Mínimo 4 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required={!keepCedula}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="conf-pass">Confirmar Contraseña</label>
                  <input
                    id="conf-pass"
                    type="password"
                    placeholder="Repita la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!keepCedula}
                  />
                </div>
              </div>
            )}

            <div className="setup-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setStep('cedula')}
              >
                Volver
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar y Acceder'}
              </button>
            </div>
          </form>
        )}

        {/* PASO 2B: Ingreso con Contraseña Registrada */}
        {step === 'password' && currentUser && (
          <form onSubmit={handlePasswordSubmit} className="login-form animate-fadeIn">
            <div className="user-identify-box">
              <img src={currentUser.avatar} alt="Avatar" className="identify-avatar" />
              <div>
                <strong className="identify-name">{currentUser.nombre}</strong>
                <span className="identify-role">{currentUser.correo}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password-input">
                Contraseña
              </label>
              <div className="input-icon-wrapper">
                <span className="input-prefix-icon">🔒</span>
                <input
                  id="password-input"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="login-input"
                />
              </div>
              <p className="form-help">
                Si no la has cambiado, tu contraseña es tu número de cédula.
              </p>
            </div>

            <div className="login-action-buttons">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setStep('cedula'); setPassword(''); }}
              >
                Cambiar Cédula
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
        )}

        {/* Sección de Cédulas de Prueba Rápidas para Testeo */}
        <div className="test-credentials-section">
          <div className="test-credentials-header">
            <span>💡 Cédulas de Prueba por Rol Institucional:</span>
          </div>
          <div className="test-credentials-grid">
            {testAccounts.map((acc) => (
              <button
                key={acc.cedula}
                type="button"
                className={`test-acc-chip ${cedula === acc.cedula ? 'selected' : ''}`}
                onClick={() => handleSelectTestAccount(acc.cedula)}
                title={`Usar cédula de ${acc.name} (${acc.role})`}
              >
                <span className="chip-icon">{acc.icon}</span>
                <div className="chip-info">
                  <span className="chip-role">{acc.role}</span>
                  <span className="chip-cedula">{acc.cedula}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="login-footer">
          <span>Unidad Educativa Montepiedra &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
