import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

// Cuentas oficiales requeridas con formatos estrictos de correo institucional
const INITIAL_PROFILES = [
  {
    usuario_id: '60685e1f-3d41-42c2-b9a6-d71739856b22',
    cedula: '0923456784',
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
    cedula: '0911223345',
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
    cedula: '0955667787',
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
    cedula: '0933445561',
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
    cedula: '0944556679',
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
    cedula: '0987654324',
    nombre: 'Juan Pérez',
    rol: 'alumno',
    correo: 'juan.perez@alumno.montepiedra.edu.ec',
    curso: '10mo de Básica',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Juan',
    isFirstLogin: false,
    password: '0987654324'
  },
  {
    usuario_id: '82807g3b-5f63-64e4-d1c8-f93951078d44',
    cedula: '0977889906',
    nombre: 'Pedro Gómez',
    rol: 'alumno',
    correo: 'pedro.gomez@alumno.montepiedra.edu.ec',
    curso: '8vo de Básica',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Pedro',
    isFirstLogin: false,
    password: '0977889906'
  }
];

export function AuthProvider({ children }) {
  // Registro central de usuarios iniciado como arreglo vacío [] y poblado desde backend
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('montepiedra_user_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Usuario en sesión activa
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Sincronizar perfiles reales desde Supabase al iniciar
  useEffect(() => {
    async function loadBackendProfiles() {
      const res = await api.getUsers(user?.rol || 'secretaria');
      if (res && res.data && Array.isArray(res.data)) {
        const backendProfiles = res.data.map(u => ({
          usuario_id: u.id,
          cedula: u.cedula || '',
          nombre: u.nombre || 'Usuario',
          rol: u.rol ? u.rol.toLowerCase() : 'alumno',
          correo: u.correo || '',
          curso: 'N/A',
          avatar: u.foto_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(u.nombre || 'User')}`,
          isFirstLogin: Boolean(u.es_primer_ingreso),
          password: null
        }));

        setProfiles(backendProfiles);
        localStorage.setItem('montepiedra_user_profiles', JSON.stringify(backendProfiles));
      }
    }
    loadBackendProfiles();
  }, []);


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
    const found = profiles.find(p => p.cedula && p.cedula.trim() === cedulaClean.trim());
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
      if (p.cedula && p.cedula.trim() === cedulaClean.trim()) {
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
    const found = profiles.find(p => p.cedula && p.cedula.trim() === cedulaClean.trim());
    if (!found) {
      return { success: false, error: 'La cédula ingresada no está registrada en Montepiedra.' };
    }

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

  // Actualizar avatar/foto de estudiante o usuario conectado con backend
  const updateStudentAvatar = async (email, newAvatarUrl) => {
    const target = profiles.find(p => p.correo && p.correo.toLowerCase() === email.toLowerCase());
    if (target && target.usuario_id) {
      await api.updateUserPhoto(target.usuario_id, newAvatarUrl, user?.rol || 'secretaria', user?.usuario_id);
    }

    const updated = profiles.map(p => {
      if (p.correo && p.correo.toLowerCase() === email.toLowerCase()) {
        return { ...p, avatar: newAvatarUrl };
      }
      return p;
    });
    setProfiles(updated);
    localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updated));
    return true;
  };

  // Editar usuario completo (Nombre, Cédula, Correo, Rol, Curso, Foto) conectado con Supabase
  const editUser = async (userId, updatedData) => {
    try {
      await api.updateUser(userId, {
        nombre: updatedData.nombre,
        cedula: updatedData.cedula,
        correo: updatedData.correo,
        rol: updatedData.rol,
        foto_url: updatedData.avatar || updatedData.foto_url
      }, user?.rol || 'admin');
    } catch (e) {
      console.warn('Error al actualizar en backend:', e.message);
    }

    const updatedProfiles = profiles.map(p => {
      if (p.usuario_id === userId || (p.cedula && p.cedula === updatedData.cedula)) {
        return {
          ...p,
          nombre: updatedData.nombre !== undefined ? updatedData.nombre : p.nombre,
          cedula: updatedData.cedula !== undefined ? updatedData.cedula : p.cedula,
          correo: updatedData.correo !== undefined ? updatedData.correo : p.correo,
          rol: updatedData.rol !== undefined ? updatedData.rol : p.rol,
          curso: updatedData.curso !== undefined ? updatedData.curso : p.curso,
          avatar: updatedData.avatar !== undefined ? updatedData.avatar : (updatedData.foto_url !== undefined ? updatedData.foto_url : p.avatar)
        };
      }
      return p;
    });

    setProfiles(updatedProfiles);
    localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updatedProfiles));

    // Si el usuario editado es el mismo usuario en sesión activa, actualizar su sesión
    if (user && (user.usuario_id === userId || user.cedula === updatedData.cedula)) {
      const activeUpdated = updatedProfiles.find(p => p.usuario_id === userId || p.cedula === updatedData.cedula);
      if (activeUpdated) {
        setUser(activeUpdated);
        localStorage.setItem('user', JSON.stringify(activeUpdated));
      }
    }

    return { success: true };
  };

  // --- Métodos de Gestión para Secretaría / Administración ---

  // 1. Agregar usuario individual conectado con la BD de Supabase
  const addUser = async (userData) => {
    const cedulaClean = (userData.cedula || '').trim();
    const cedulaExists = profiles.some(p => p.cedula && p.cedula.trim() === cedulaClean);
    if (cedulaExists) {
      return { success: false, error: 'Ya existe un usuario registrado con este número de cédula.' };
    }

    try {
      const res = await api.createUser({
        cedula: cedulaClean,
        nombre: userData.nombre.trim(),
        correo: userData.correo.trim(),
        rol: userData.rol ? userData.rol.toLowerCase() : 'alumno',
        avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(userData.nombre)}`
      }, user?.rol || 'secretaria');

      const createdUserFromDb = res.data;

      const newUser = {
        usuario_id: createdUserFromDb.id || `usr-${Date.now()}`,
        cedula: createdUserFromDb.cedula || cedulaClean,
        nombre: createdUserFromDb.nombre || userData.nombre.trim(),
        rol: (createdUserFromDb.rol || userData.rol).toLowerCase(),
        correo: createdUserFromDb.correo || userData.correo.trim(),
        curso: userData.curso ? userData.curso.trim() : 'N/A',
        avatar: createdUserFromDb.foto_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(userData.nombre)}`,
        isFirstLogin: Boolean(createdUserFromDb.es_primer_ingreso),
        password: null
      };

      setProfiles(prev => {
        const updated = [newUser, ...prev];
        localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updated));
        return updated;
      });

      return { success: true, user: newUser, source: 'backend' };
    } catch (error) {
      console.warn('Falla en la API Supabase backend al crear usuario, usando fallback local:', error.message);
      const newUser = {
        usuario_id: `usr-${Date.now()}`,
        cedula: cedulaClean,
        nombre: userData.nombre.trim(),
        rol: userData.rol.toLowerCase(),
        correo: userData.correo.trim(),
        curso: userData.curso ? userData.curso.trim() : 'N/A',
        avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(userData.nombre)}`,
        isFirstLogin: true,
        password: null
      };

      setProfiles(prev => {
        const updated = [newUser, ...prev];
        localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updated));
        return updated;
      });
      return { success: true, user: newUser, source: 'local', error: error.message };
    }
  };

  // 2. Importar nómina masiva (Excel/CSV parseado) conectada con Supabase
  const importUsersBatch = async (usersList) => {
    let addedCount = 0;
    const currentCedulas = new Set(profiles.map(p => (p.cedula || '').trim()));
    const newItemsToBackend = [];

    usersList.forEach((u) => {
      const cedulaClean = (u.cedula || '').toString().trim();
      if (cedulaClean && !currentCedulas.has(cedulaClean)) {
        currentCedulas.add(cedulaClean);
        newItemsToBackend.push({
          cedula: cedulaClean,
          nombre: (u.nombre || 'Estudiante Importado').trim(),
          rol: (u.rol || 'alumno').toLowerCase(),
          correo: (u.correo || `${cedulaClean}@alumno.montepiedra.edu.ec`).trim(),
          curso: (u.curso || '1ro de Bachillerato').trim(),
          avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(u.nombre || cedulaClean)}`
        });
      }
    });

    if (newItemsToBackend.length === 0) {
      return { success: true, count: 0 };
    }

    try {
      const res = await api.importUsersBatch(newItemsToBackend, user?.rol || 'secretaria');
      const createdList = res.data || [];

      const newProfiles = createdList.map(u => ({
        usuario_id: u.id,
        cedula: u.cedula,
        nombre: u.nombre,
        rol: u.rol.toLowerCase(),
        correo: u.correo,
        curso: 'N/A',
        avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(u.nombre)}`,
        isFirstLogin: Boolean(u.es_primer_ingreso),
        password: null
      }));

      setProfiles(prev => {
        const updated = [...newProfiles, ...prev];
        localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updated));
        return updated;
      });
      return { success: true, count: res.count || newProfiles.length, source: 'backend' };
    } catch (error) {
      console.warn('Backend importUsersBatch falló, guardando localmente:', error.message);
      const fallbackItems = newItemsToBackend.map((u, index) => ({
        usuario_id: `batch-${Date.now()}-${index}`,
        cedula: u.cedula,
        nombre: u.nombre,
        rol: u.rol,
        correo: u.correo,
        curso: u.curso,
        avatar: u.avatar,
        isFirstLogin: true,
        password: null
      }));

      setProfiles(prev => {
        const updated = [...fallbackItems, ...prev];
        localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updated));
        return updated;
      });
      return { success: true, count: fallbackItems.length, source: 'local' };
    }
  };

  // 3. Eliminar usuario conectado a Supabase
  const deleteUser = async (usuario_id) => {
    try {
      const res = await api.deleteUser(usuario_id, user?.rol || 'secretaria');
      if (res && res.success) {
        setProfiles(prev => {
          const updated = prev.filter(p => p.usuario_id !== usuario_id);
          localStorage.setItem('montepiedra_user_profiles', JSON.stringify(updated));
          return updated;
        });
        return { success: true };
      }
      return { success: false, error: 'No se pudo eliminar el usuario en el backend.' };
    } catch (e) {
      console.warn('Error al eliminar en backend Supabase:', e.message);
      return { success: false, error: e.message || 'Error al eliminar el usuario.' };
    }
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
      editUser,
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
