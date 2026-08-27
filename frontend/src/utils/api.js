// frontend/src/utils/api.js
// Cliente HTTP adaptado al contrato de datos de 10 columnas y headers de rol

const API_BASE_URL = 'http://127.0.0.1:8080';

// Datos semilla de fallback con el nuevo formato del contrato (10 columnas + usuarios)
const SEED_SUGGESTIONS = [
  {
    id: 'sug-1',
    created_at: '2026-06-28T14:30:00.000Z',
    titulo: 'Áreas verdes en el patio central',
    categoria: 'Infraestructura',
    descripcion: 'Sería excelente colocar más plantas ornamentales y césped en las zonas de descanso. Ayudaría a tener un ambiente más fresco y agradable durante el recreo.',
    estado: 'Realizada',
    es_anonimo: false,
    votos: 18,
    respuesta_moderador: 'El departamento de mantenimiento completó la instalación de jardineras y nuevo césped.',
    foto_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86',
    usuario_id: '60685e1f-3d41-42c2-b9a6-d71739856b22',
    usuarios: {
      id: '60685e1f-3d41-42c2-b9a6-d71739856b22',
      nombre: 'Daniel Mendoza',
      correo: 'daniel@alumno.montepiedra.edu.ec',
      foto_url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Daniel'
    }
  },
  {
    id: 'sug-2',
    created_at: '2026-07-01T09:15:00.000Z',
    titulo: 'Reparación de luminarias en el Bloque B',
    categoria: 'Infraestructura',
    descripcion: 'Dos lámparas del pasillo del segundo piso del Bloque B parpadean constantemente y dificultan la visión en las noches.',
    estado: 'En Proceso',
    es_anonimo: true,
    votos: 8,
    respuesta_moderador: 'Asignado al equipo de Mantenimiento para reemplazo de balastros y tubos LED.',
    foto_url: null,
    usuario_id: '71796f2a-4e52-53d3-c0b7-e82840967c33',
    usuarios: {
      id: '71796f2a-4e52-53d3-c0b7-e82840967c33',
      nombre: 'Juan Pérez',
      correo: 'juan.perez@alumno.montepiedra.edu.ec',
      foto_url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Juan'
    }
  },
  {
    id: 'sug-3',
    created_at: '2026-06-25T11:00:00.000Z',
    titulo: 'Talleres extracurriculares de Robótica',
    categoria: 'Academico',
    descripcion: 'Me gustaría que se abran clubes o talleres de robótica y electrónica los días sábados, para fomentar las habilidades tecnológicas en los estudiantes.',
    estado: 'Aprobada',
    es_anonimo: true,
    votos: 14,
    respuesta_moderador: 'Agradecemos tu iniciativa. A partir del próximo mes, implementaremos el taller de robótica los viernes por la tarde.',
    foto_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    usuario_id: '82807g3b-5f63-64e4-d1c8-f93951078d44',
    usuarios: {
      id: '82807g3b-5f63-64e4-d1c8-f93951078d44',
      nombre: 'Pedro Gómez',
      correo: 'pedro.gomez@alumno.montepiedra.edu.ec',
      foto_url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Pedro'
    }
  },
  {
    id: 'sug-4',
    created_at: '2026-07-02T16:45:00.000Z',
    titulo: 'Mantenimiento y pintura de canchas deportivas',
    categoria: 'Infraestructura',
    descripcion: 'Las líneas de la cancha de básquetbol y vóley están desgastadas y los tableros requieren pintura anticorrosiva.',
    estado: 'Aprobada',
    es_anonimo: false,
    votos: 6,
    respuesta_moderador: 'Aprobada para ejecución por el personal de Mantenimiento durante el receso escolar.',
    foto_url: null,
    usuario_id: '60685e1f-3d41-42c2-b9a6-d71739856b22',
    usuarios: {
      id: '60685e1f-3d41-42c2-b9a6-d71739856b22',
      nombre: 'Daniel Mendoza',
      correo: 'daniel@alumno.montepiedra.edu.ec',
      foto_url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Daniel'
    }
  },
  {
    id: 'sug-5',
    created_at: '2026-07-05T10:20:00.000Z',
    titulo: 'Ampliación del horario de la Biblioteca Virtual',
    categoria: 'Academico',
    descripcion: 'Solicitamos extender el acceso a la sala de computadoras hasta las 18:00 para realizar tareas e investigaciones grupales.',
    estado: 'Pendiente',
    es_anonimo: true,
    votos: 2,
    respuesta_moderador: null,
    foto_url: null,
    usuario_id: '71796f2a-4e52-53d3-c0b7-e82840967c33',
    usuarios: {
      id: '71796f2a-4e52-53d3-c0b7-e82840967c33',
      nombre: 'Juan Pérez',
      correo: 'juan.perez@alumno.montepiedra.edu.ec',
      foto_url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Juan'
    }
  }
];

// Inicializar almacenamiento local si no existe
function initLocalStorage() {
  if (!localStorage.getItem('montepiedra_sugerencias')) {
    localStorage.setItem('montepiedra_sugerencias', JSON.stringify(SEED_SUGGESTIONS));
  }
  if (!localStorage.getItem('montepiedra_user_votes')) {
    localStorage.setItem('montepiedra_user_votes', JSON.stringify({}));
  }
}

initLocalStorage();

// Helper para anonimizar datos localmente si el backend está desconectado
function formatSuggestionsByRole(suggestions, userRole) {
  const normalizedRole = (userRole || 'alumno').toLowerCase();

  return suggestions.map(item => {
    // Si la sugerencia ya viene procesada con objeto usuarios
    let userInfo = item.usuarios || {
      id: item.usuario_id || null,
      nombre: 'Comunidad Montepiedra',
      correo: 'contacto@montepiedra.edu.ec',
      foto_url: null
    };

    if (item.es_anonimo && normalizedRole !== 'admin' && normalizedRole !== 'administrador') {
      userInfo = {
        id: null,
        nombre: 'Anónimo',
        correo: 'anonimo@montepiedra.edu.ec',
        foto_url: null
      };
    }

    return {
      ...item,
      votos: item.votos !== undefined ? item.votos : 0,
      estado: item.estado || 'Pendiente',
      respuesta_moderador: item.respuesta_moderador || item.respuesta || null,
      usuarios: userInfo
    };
  });
}

// Mapeador de roles compatibles con backend
export function normalizeRoleForHeader(role) {
  if (!role) return 'alumno';
  const lower = role.toLowerCase();
  if (lower === 'administrador' || lower === 'admin') return 'admin';
  if (lower === 'profesor' || lower === 'docente') return 'profesor';
  if (lower === 'mantenimiento') return 'mantenimiento';
  if (lower === 'secretaria' || lower === 'secretaría') return 'secretaria';
  return 'alumno';
}

export const api = {
  // 1. Obtener todas las sugerencias con envío de header 'x-user-role' y 'x-user-id'
  async getSuggestions(userRole = 'alumno', userId = null) {
    const headerRole = normalizeRoleForHeader(userRole);
    const headers = {
      'x-user-role': headerRole
    };
    if (userId) {
      headers['x-user-id'] = String(userId);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Error en servidor: ${response.status}`);
      }

      const result = await response.json();

      if (result.data) {
        // Si la API devuelve user_vote para el usuario actual, actualizar la caché de votos de usuario
        if (userId && Array.isArray(result.data)) {
          const userVotes = JSON.parse(localStorage.getItem('montepiedra_user_votes') || '{}');
          const userMap = userVotes[userId] || {};
          result.data.forEach(item => {
            if (item.user_vote !== undefined) {
              userMap[item.id] = item.user_vote;
            }
          });
          userVotes[userId] = userMap;
          localStorage.setItem('montepiedra_user_votes', JSON.stringify(userVotes));
        }

        // Almacenar caché local
        localStorage.setItem('montepiedra_sugerencias', JSON.stringify(result.data));
        return { data: result.data, source: 'backend' };
      }
      throw new Error('Formato de respuesta incorrecto');
    } catch (error) {
      console.warn('Backend desconectado o error. Usando fallback local:', error.message);
      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      const formatted = formatSuggestionsByRole(localData, userRole);
      return { data: formatted, source: 'local' };
    }
  },

  // 2. Crear una nueva sugerencia con envío de header 'x-user-role'
  async createSuggestion({ titulo, descripcion, categoria, usuario_id, es_anonimo = true, foto_url = null, userRole = 'alumno', authorProfile = null }) {
    const headerRole = normalizeRoleForHeader(userRole);
    const payload = {
      titulo,
      descripcion,
      categoria,
      usuario_id,
      es_anonimo: Boolean(es_anonimo),
      votos: 0,
      respuesta_moderador: null,
      foto_url: foto_url || null
    };

    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': headerRole
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `Error ${response.status}`);
      }

      const result = await response.json();

      // Guardar en caché local
      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      const newSug = {
        ...result.data,
        usuarios: authorProfile || {
          id: usuario_id,
          nombre: 'Estudiante',
          correo: 'alumno@montepiedra.edu.ec',
          foto_url: null
        }
      };
      localData.unshift(newSug);
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(localData));

      return { data: newSug, source: 'backend' };
    } catch (error) {
      console.warn('Error al guardar en backend. Guardando localmente:', error.message);

      // Manejar error de lenguaje inapropiado específicamente
      if (error.message && error.message.includes('inapropiado')) {
        throw error;
      }

      const simulatedData = {
        id: `sug-${Date.now()}`,
        created_at: new Date().toISOString(),
        titulo,
        descripcion,
        categoria,
        estado: 'Pendiente',
        es_anonimo: Boolean(es_anonimo),
        votos: 0,
        respuesta_moderador: null,
        foto_url: foto_url || null,
        usuario_id,
        usuarios: es_anonimo && headerRole !== 'admin'
          ? { id: null, nombre: 'Anónimo', correo: 'anonimo@montepiedra.edu.ec', foto_url: null }
          : (authorProfile || { id: usuario_id, nombre: 'Estudiante', correo: 'alumno@montepiedra.edu.ec', foto_url: null })
      };

      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      localData.unshift(simulatedData);
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(localData));

      return { data: simulatedData, source: 'local', isSimulated: true };
    }
  },

  // 3. Sistema de Votación (Like / Dislike con toggle de desmarcado)
  async voteSuggestion(id, voteType = 'like', userId = 'usr-default', userRole = 'alumno') {
    const userVotes = JSON.parse(localStorage.getItem('montepiedra_user_votes') || '{}');
    const userMap = userVotes[userId] || {};
    const previousVote = userMap[id]; // 'like', 'dislike', or null/undefined

    // Si el usuario vuelve a presionar la opción elegida previamente -> TOGGLE OFF (quitar voto)
    const isTogglingOff = previousVote === voteType;
    const nextVote = isTogglingOff ? null : voteType;

    let voteDelta = 0;
    if (isTogglingOff) {
      voteDelta = previousVote === 'like' ? -1 : 0;
    } else if (!previousVote) {
      voteDelta = voteType === 'like' ? 1 : 0;
    } else if (previousVote === 'dislike' && voteType === 'like') {
      voteDelta = 1;
    } else if (previousVote === 'like' && voteType === 'dislike') {
      voteDelta = -1;
    }

    // Registrar o remover voto localmente
    if (nextVote) {
      userMap[id] = nextVote;
    } else {
      delete userMap[id];
    }
    userVotes[userId] = userMap;
    localStorage.setItem('montepiedra_user_votes', JSON.stringify(userVotes));

    let backendResult = null;
    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias/${id}/votar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': normalizeRoleForHeader(userRole),
          'x-user-id': String(userId)
        },
        body: JSON.stringify({
          usuario_id: String(userId),
          tipo_voto: voteType
        })
      });

      if (response.ok) {
        backendResult = await response.json();
      }
    } catch (e) {
      console.info('Voto sincronizado localmente:', e.message);
    }

    // Actualizar conteo local
    const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
    let updatedVotes = 0;
    const updated = localData.map(item => {
      if (item.id === id) {
        if (backendResult && backendResult.likes !== undefined) {
          updatedVotes = backendResult.likes;
        } else {
          const current = item.votos || 0;
          updatedVotes = Math.max(0, current + voteDelta);
        }
        return { ...item, votos: updatedVotes };
      }
      return item;
    });
    localStorage.setItem('montepiedra_sugerencias', JSON.stringify(updated));

    return {
      success: true,
      id,
      votos: backendResult?.likes !== undefined ? backendResult.likes : updatedVotes,
      currentVote: backendResult?.currentVote !== undefined ? backendResult.currentVote : nextVote
    };
  },

  // Obtener voto registrado del usuario para una sugerencia
  getUserVote(sugId, userId) {
    if (!userId) return null;
    const userVotes = JSON.parse(localStorage.getItem('montepiedra_user_votes') || '{}');
    return userVotes[userId]?.[sugId] || null;
  },

  // 4. Moderar / Actualizar Estado y Respuesta de una Sugerencia
  async updateSuggestionModeration(id, estado, respuesta_moderador, userRole = 'profesor') {
    const headerRole = normalizeRoleForHeader(userRole);
    const payload = {
      estado,
      respuesta_moderador
    };

    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias/${id}/moderacion`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': headerRole
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Error ${response.status}`);
      }

      const result = await response.json();

      // Actualizar en caché local
      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      const updated = localData.map(item => {
        if (item.id === id) {
          return { ...item, estado, respuesta_moderador };
        }
        return item;
      });
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(updated));

      return { data: result, source: 'backend' };
    } catch (error) {
      console.warn('Actualización de moderación falló en backend. Guardando localmente:', error.message);

      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      const updated = localData.map(item => {
        if (item.id === id) {
          return { ...item, estado, respuesta_moderador };
        }
        return item;
      });
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(updated));

      return {
        data: { id, estado, respuesta_moderador },
        source: 'local',
        isSimulated: true
      };
    }
  },

  // 5. Eliminar sugerencia
  async deleteSuggestion(id, userRole = 'admin') {
    const headerRole = normalizeRoleForHeader(userRole);
    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': headerRole
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      const filtered = localData.filter(item => item.id !== id);
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(filtered));

      return { success: true, source: 'backend' };
    } catch (error) {
      console.warn('Error al borrar en el backend. Eliminando localmente:', error.message);

      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      const filtered = localData.filter(item => item.id !== id);
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(filtered));

      return { success: true, source: 'local', error: error.message };
    }
  },

  // --- MÓDULO 3: GESTIÓN DE USUARIOS Y NÓMINAS EN SUPABASE ---
  async getUsers(userRole = 'secretaria') {
    const headerRole = normalizeRoleForHeader(userRole);
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'GET',
        headers: {
          'x-user-role': headerRole
        }
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const data = await response.json();
      return { data, source: 'backend' };
    } catch (error) {
      console.warn('Error al consultar usuarios en backend:', error.message);
      return { data: null, source: 'local', error: error.message };
    }
  },

  async createUser(userData, userRole = 'secretaria') {
    const headerRole = normalizeRoleForHeader(userRole);
    const payload = {
      cedula: userData.cedula ? String(userData.cedula).trim() : '',
      nombre: userData.nombre ? String(userData.nombre).trim() : '',
      correo: userData.correo ? String(userData.correo).trim() : '',
      rol: userData.rol ? String(userData.rol).trim() : 'alumno',
      foto_url: userData.avatar || userData.foto_url || null
    };

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': headerRole
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.error || `Error ${response.status}`);
      }

      return { data: resData.usuario, message: resData.message, source: 'backend' };
    } catch (error) {
      console.warn('Error al registrar usuario en Supabase backend:', error.message);
      throw error;
    }
  },

  async importUsersBatch(usersList, userRole = 'secretaria') {
    const headerRole = normalizeRoleForHeader(userRole);
    const payload = {
      nomina: usersList.map(u => ({
        cedula: u.cedula ? String(u.cedula).trim() : '',
        nombre: u.nombre ? String(u.nombre).trim() : '',
        correo: u.correo ? String(u.correo).trim() : '',
        rol: u.rol ? String(u.rol).trim() : 'alumno',
        foto_url: u.avatar || u.foto_url || null
      }))
    };

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/registro-masivo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': headerRole
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.error || `Error ${response.status}`);
      }

      return { data: resData.usuarios, count: resData.total_registrados, source: 'backend' };
    } catch (error) {
      console.warn('Error al importar nómina masiva en backend:', error.message);
      throw error;
    }
  },

  async deleteUser(userId, userRole = 'secretaria') {
    const headerRole = normalizeRoleForHeader(userRole);
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': headerRole
        }
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.error || `Error ${response.status}`);
      }

      return { success: true, usuario: resData.usuario, source: 'backend' };
    } catch (error) {
      console.warn('Error al eliminar usuario en backend:', error.message);
      throw error;
    }
  },

  async updateUserPhoto(userId, photoUrl, userRole = 'secretaria', requesterId = null) {
    const headerRole = normalizeRoleForHeader(userRole);
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${userId}/foto`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': headerRole,
          'x-user-id': String(requesterId || userId)
        },
        body: JSON.stringify({ foto_url: photoUrl })
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.error || `Error ${response.status}`);
      }

      return { success: true, data: resData, source: 'backend' };
    } catch (error) {
      console.warn('Error al actualizar foto en backend:', error.message);
      return { success: false, error: error.message, source: 'local' };
    }
  },

  async updateUser(userId, userData, userRole = 'secretaria') {
    const headerRole = normalizeRoleForHeader(userRole);
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': headerRole
        },
        body: JSON.stringify(userData)
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.error || `Error ${response.status}`);
      }

      return { success: true, usuario: resData.usuario, source: 'backend' };
    } catch (error) {
      console.warn('Error al actualizar usuario en backend:', error.message);
      return { success: false, error: error.message, source: 'local' };
    }
  },

  // 6. Obtener comentarios de una sugerencia
  async getComments(sugerenciaId, userRole = 'alumno') {
    const headerRole = normalizeRoleForHeader(userRole);
    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias/${sugerenciaId}/comentarios`, {
        method: 'GET',
        headers: { 'x-user-role': headerRole }
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const data = await response.json();
      return { data: data.comentarios || data.data || [], source: 'backend' };
    } catch (e) {
      console.warn('Error al obtener comentarios de backend:', e.message);
      const localComments = JSON.parse(localStorage.getItem(`comments_${sugerenciaId}`) || '[]');
      return { data: localComments, source: 'local' };
    }
  },

  // 7. Crear comentario en una sugerencia
  async createComment(sugerenciaId, { usuario_id, texto }, userRole = 'alumno') {
    const headerRole = normalizeRoleForHeader(userRole);
    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias/${sugerenciaId}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': headerRole
        },
        body: JSON.stringify({ usuario_id, texto })
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.error || `Error ${response.status}`);
      }

      const createdObj = resData.comentario || resData.data;

      // Guardar en caché local
      const localComments = JSON.parse(localStorage.getItem(`comments_${sugerenciaId}`) || '[]');
      localComments.push(createdObj);
      localStorage.setItem(`comments_${sugerenciaId}`, JSON.stringify(localComments));

      return { data: createdObj, source: 'backend' };
    } catch (e) {
      if (e.message && e.message.includes('inapropiado')) {
        throw e;
      }
      console.warn('Error al enviar comentario a backend, guardando localmente:', e.message);
      const newComment = {
        id: `com-${Date.now()}`,
        sugerencia_id: sugerenciaId,
        usuario_id,
        texto,
        created_at: new Date().toISOString()
      };
      const localComments = JSON.parse(localStorage.getItem(`comments_${sugerenciaId}`) || '[]');
      localComments.push(newComment);
      localStorage.setItem(`comments_${sugerenciaId}`, JSON.stringify(localComments));

      return { data: newComment, source: 'local' };
    }
  }
};

// Función de validación de cédula ecuatoriana
export function validateEcuadorianCedula(cedula) {
  if (!cedula || typeof cedula !== 'string') {
    return { isValid: false, message: 'La cédula es requerida.' };
  }
  const clean = cedula.trim();
  if (!/^\d{10}$/.test(clean)) {
    return { isValid: false, message: 'La cédula debe contener exactamente 10 dígitos numéricos (no letras ni guiones).' };
  }
  const province = parseInt(clean.substring(0, 2), 10);
  if (province < 1 || province > 24) {
    return { isValid: false, message: 'Código de provincia inválido. Los 2 primeros dígitos deben estar entre 01 y 24.' };
  }
  return { isValid: true, message: '' };
}

