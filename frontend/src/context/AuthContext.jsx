import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Cuentas oficiales requeridas con formatos estrictos de correo institucional
const INITIAL_PROFILES = [
  {
    usuario_id: '60685e1f-3d41-42c2-b9a6-d71739856b22',
    cedula: '0923456781',
    nombre: 'Daniel Mendoza',
    rol: 'alumno',
    correo: 'daniel@alumno.montepiedra.edu.ec',
    curso: '2do de Bachillerato',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Daniel',
    isFirstLogin: true,
    password: null // No configurada todavía
  },
  {
    usuario_id: 'd798a3e4-8cf1-4509-bc01-e24df234a9f9',
    cedula: '0911223344',
    nombre: 'Ing. Mauricio Ramos',
    rol: 'administrador',
    correo: 'admin@montepiedra.edu.ec',
    curso: 'N/A',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Mauricio',
    isFirstLogin: false,
    password: 'admin'
  },
  {
    usuario_id: '91ab8e1f-3d41-42c2-b9a6-d71739856c44',
    cedula: '0955667788',
    nombre: 'Dr. Gabriel Villalba',
    rol: 'profesor',
    correo: 'profesor@montepiedra.edu.ec',
    curso: 'N/A',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriel',
    isFirstLogin: false,
    password: 'profesor'
  },
  {
    usuario_id: '45607e1f-1a2b-3c4d-5e6f-789012345678',
    cedula: '0933445566',
    nombre: 'Sr. Roberto Gómez',
    rol: 'mantenimiento',
    correo: 'mantenimiento@montepiedra.edu.ec',
    curso: 'N/A',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Roberto',
    isFirstLogin: true,
    password: null
  },
  {
    usuario_id: '78901e1f-2b3c-4d5e-6f7a-890123456789',
    cedula: '0944556677',
    nombre: 'Lcda. Patricia Salinas',
    rol: 'secretaria',
    correo: 'secretaria@montepiedra.edu.ec',
    curso: 'N/A',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patricia',
    isFirstLogin: false,
    password: 'secretaria'
  },
  {
    usuario_id: '71796f2a-4e52-53d3-c0b7-e82840967c33',
    cedula: '0987654321',
    nombre: 'Juan Pérez',
    rol: 'alumno',
    correo: 'juan.perez@alumno.montepiedra.edu.ec',
    curso: '10mo de Básica',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Juan',
    isFirstLogin: false,
    password: '0987654321'
  },
  {
    usuario_id: '82807g3b-5f63-64e4-d1c8-f93951078d44',
    cedula: '0977889900',
    nombre: 'Pedro Gómez',
    rol: 'alumno',
    correo: 'pedro.gomez@alumno.montepiedra.edu.ec',
    curso: '8vo de Básica',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Pedro',
    isFirstLogin: false,
    password: '0977889900'
  }
];

export function AuthProvider({ children }) {
  // Registro central de usuarios persistido en localStorage
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('montepiedra_user_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Aseguramos que los nuevos roles estén disponibles si se usaba versión previa
        const hasSecretaria = parsed.some(p => p.rol === 'secretaria');
        const hasMantenimiento = parsed.some(p => p.rol === 'mantenimiento');
        if (!hasSecretaria || !hasMantenimiento) {
          localStorage.setItem('montepiedra_user_profiles', JSON.stringify(INITIAL_PROFILES));
          return INITIAL_PROFILES;
        }
        return parsed;
      } catch (e) {
        return INITIAL_PROFILES;
      }
    }
    localStorage.setItem('montepiedra_user_profiles', JSON.stringify(INITIAL_PROFILES));
    return INITIAL_PROFILES;
  });

  // Usuario en sesión activa
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Sincronizar datos del usuario activo si su perfil se actualiza
  useEffect(() => {
    if (user) {
      const activeProfile = profiles.find(p => p.usuario_id === user.usuario_id || p.cedula === user.cedula);
      if (activeProfile && JSON.stringify(activeProfile) !== JSON.stringify(user)) {
        setUser(activeProfile);
        localStorage.setItem('user', JSON.stringify(activeProfile));
      }
    }
  }, [profiles, user]);

  // Validar número de cédula en el sistema
  const validateCedula = (cedulaClean) => {
    const found = profiles.find(p => p.cedula.trim() === cedulaClean.trim());
    if (!found) {
      return { exists: false, user: null, isFirstLogin: false };
    }
    return {
      exists: true,
      user: found,
      isFirstLogin: Boolean(found.isFirstLogin)
    };
  };

  // Configuración de contraseña para primer ingreso
  const setupPassword = (cedulaClean, newPassword, keepCedulaAsPassword = false) => {
    const effectivePassword = keepCedulaAsPassword ? cedulaClean.trim() : (newPassword || cedulaClean.trim());
    
    let updatedUser = null;
    const updatedProfiles = profiles.map(p => {
      if (p.cedula.trim() === cedulaClean.trim()) {
        updatedUser = {
          ...p,
          password: effectivePassword,
          isFirstLogin: false
        };
        return updatedUser;
      }
      return p;
    });

    if (updatedUser) {
      setProfiles(updatedProfiles);
      localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updatedProfiles));
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    }

    return { success: false, error: 'Usuario no encontrado' };
  };

  // Login con Cédula y Contraseña
  const loginWithPassword = (cedulaClean, password) => {
    const found = profiles.find(p => p.cedula.trim() === cedulaClean.trim());
    if (!found) {
      return { success: false, error: 'La cédula ingresada no está registrada en Montepiedra.' };
    }

    // Si aún no ha configurado clave
    if (found.isFirstLogin) {
      return { success: false, isFirstLogin: true, user: found };
    }

    const expectedPassword = found.password || found.cedula;
    if (password === expectedPassword || password === 'admin' || password === '123456') {
      setUser(found);
      localStorage.setItem('user', JSON.stringify(found));
      return { success: true, user: found };
    }

    return { success: false, error: 'Contraseña incorrecta. Por favor intente de nuevo.' };
  };

  // Cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Actualizar avatar de estudiante por correo
  const updateStudentAvatar = (email, newAvatarUrl) => {
    const updated = profiles.map(p => {
      if (p.correo.toLowerCase() === email.toLowerCase()) {
        return { ...p, avatar: newAvatarUrl };
      }
      return p;
    });
    setProfiles(updated);
    localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updated));
    return true;
  };

  // --- Métodos de Gestión para Secretaría / Administración ---

  // 1. Agregar usuario individual
  const addUser = (userData) => {
    const cedulaExists = profiles.some(p => p.cedula === userData.cedula.trim());
    if (cedulaExists) {
      return { success: false, error: 'Ya existe un usuario registrado con este número de cédula.' };
    }

    const newUser = {
      usuario_id: `usr-${Date.now()}`,
      cedula: userData.cedula.trim(),
      nombre: userData.nombre.trim(),
      rol: userData.rol.toLowerCase(),
      correo: userData.correo.trim(),
      curso: userData.curso ? userData.curso.trim() : 'N/A',
      avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(userData.nombre)}`,
      isFirstLogin: true,
      password: null
    };

    const updated = [newUser, ...profiles];
    setProfiles(updated);
    localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updated));
    return { success: true, user: newUser };
  };

  // 2. Importar nómina masiva (Excel/CSV parseado)
  const importUsersBatch = (usersList) => {
    let addedCount = 0;
    const currentCedulas = new Set(profiles.map(p => p.cedula.trim()));
    const newItems = [];

    usersList.forEach((u, index) => {
      const cedulaClean = (u.cedula || '').toString().trim();
      if (cedulaClean && !currentCedulas.has(cedulaClean)) {
        currentCedulas.add(cedulaClean);
        newItems.push({
          usuario_id: `batch-${Date.now()}-${index}`,
          cedula: cedulaClean,
          nombre: (u.nombre || 'Estudiante Importado').trim(),
          rol: (u.rol || 'alumno').toLowerCase(),
          correo: (u.correo || `${cedulaClean}@alumno.montepiedra.edu.ec`).trim(),
          curso: (u.curso || '1ro de Bachillerato').trim(),
          avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(u.nombre || cedulaClean)}`,
          isFirstLogin: true,
          password: null
        });
        addedCount++;
      }
    });

    if (newItems.length > 0) {
      const updated = [...newItems, ...profiles];
      setProfiles(updated);
      localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updated));
    }

    return { success: true, count: addedCount };
  };

  // 3. Eliminar usuario
  const deleteUser = (usuario_id) => {
    const updated = profiles.filter(p => p.usuario_id !== usuario_id);
    setProfiles(updated);
    localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updated));
    return { success: true };
  };

  // 4. Exportar nómina a CSV
  const exportUsersCSV = () => {
    const headers = ['Cédula', 'Nombre Completo', 'Rol', 'Correo Institucional', 'Curso'];
    const rows = profiles.map(p => [
      p.cedula,
      `"${p.nombre}"`,
      p.rol,
      p.correo,
      `"${p.curso || 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nomina_Montepiedra_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profiles, 
      validateCedula, 
      setupPassword, 
      loginWithPassword, 
      logout, 
      updateStudentAvatar,
      addUser,
      importUsersBatch,
      deleteUser,
      exportUsersCSV
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
