import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const INITIAL_PROFILES = [
  {
    usuario_id: '60685e1f-3d41-42c2-b9a6-d71739856b22',
    nombre: 'Carlos Mendoza',
    rol: 'alumno',
    correo: 'carlos.mendoza@montepiedra.edu.ec',
    curso: '2do de Bachillerato',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carlos'
  },
  {
    usuario_id: '71796f2a-4e52-53d3-c0b7-e82840967c33',
    nombre: 'Juan Pérez',
    rol: 'alumno',
    correo: 'juan.perez@montepiedra.edu.ec',
    curso: '10mo de Básica',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Juan'
  },
  {
    usuario_id: '82807g3b-5f63-64e4-d1c8-f93951078d44',
    nombre: 'Pedro Gómez',
    rol: 'alumno',
    correo: 'pedro.gomez@montepiedra.edu.ec',
    curso: '8vo de Básica',
    avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Pedro'
  },
  {
    usuario_id: '91ab8e1f-3d41-42c2-b9a6-d71739856c44',
    nombre: 'Dr. Gabriel Villalba',
    rol: 'profesor',
    correo: 'gabriel.villalba@montepiedra.edu.ec',
    curso: 'N/A',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriel'
  },
  {
    usuario_id: 'd798a3e4-8cf1-4509-bc01-e24df234a9f9',
    nombre: 'Ing. Mauricio Ramos',
    rol: 'administrador',
    correo: 'mauricio.ramos@montepiedra.edu.ec',
    curso: 'N/A',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Mauricio'
  }
];

export function AuthProvider({ children }) {
  // Central profiles registry in localStorage
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('montepiedra_user_profiles');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('montepiedra_user_profiles', JSON.stringify(INITIAL_PROFILES));
    return INITIAL_PROFILES;
  });

  // Current session user
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Sync active user session details if their profile changes (e.g. avatar update)
  useEffect(() => {
    if (user) {
      const activeProfile = profiles.find(p => p.usuario_id === user.usuario_id);
      if (activeProfile && JSON.stringify(activeProfile) !== JSON.stringify(user)) {
        setUser(activeProfile);
        localStorage.setItem('user', JSON.stringify(activeProfile));
      }
    }
  }, [profiles, user]);

  const login = (role) => {
    // Alumno logs in as Carlos Mendoza by default in quick access
    const searchRol = role === 'estudiante' ? 'alumno' : role;
    const profile = profiles.find(p => p.rol === searchRol);
    if (profile) {
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Method to let admin update any user's profile picture by their institutional email
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

  return (
    <AuthContext.Provider value={{ user, profiles, login, logout, updateStudentAvatar }}>
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
