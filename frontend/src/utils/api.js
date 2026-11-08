// frontend/src/utils/api.js
// Cliente HTTP conectado directamente al Backend API (Supabase) sin modo offline

const API_BASE_URL = 'http://127.0.0.1:8080';

// Limpieza de residuos de modo offline para evitar desincronización
try {
  localStorage.removeItem('montepiedra_sugerencias');
} catch {}

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
  // 1. Obtener todas las sugerencias directamente desde el backend
  async getSuggestions(userRole = 'alumno', userId = null) {
    const headerRole = normalizeRoleForHeader(userRole);
    const headers = {
      'x-user-role': headerRole
    };
    if (userId) {
      headers['x-user-id'] = String(userId);
    }

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

      return { data: result.data, source: 'backend' };
    }
    throw new Error('Formato de respuesta incorrecto del servidor');
  },

  // 2. Crear una nueva sugerencia con envío de header 'x-user-role' directamente al backend
  async createSuggestion({ titulo, descripcion, categoria, usuario_id, es_anonimo = true, foto_url = null, userRole = 'alumno', authorProfile = null }) {
    const headerRole = normalizeRoleForHeader(userRole);
    const headers = {
      'Content-Type': 'application/json',
      'x-user-role': headerRole
    };
    if (usuario_id) {
      headers['x-user-id'] = String(usuario_id);
    }

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

    const response = await fetch(`${API_BASE_URL}/sugerencias`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const err = new Error(errorBody.error || `Error ${response.status}`);
      err.status = response.status;
      err.response = { status: response.status, data: errorBody };
      throw err;
    }

    const result = await response.json();
    return { data: result.data, source: 'backend' };
  },

  // 3. Sistema de Votación (Like / Dislike con toggle de desmarcado)
  async voteSuggestion(id, voteType = 'like', userId = 'usr-default', userRole = 'alumno') {
    const userVotes = JSON.parse(localStorage.getItem('montepiedra_user_votes') || '{}');
    const userMap = userVotes[userId] || {};
    const previousVote = userMap[id]; // 'like', 'dislike', or null/undefined

    // Si el usuario vuelve a presionar la opción elegida previamente -> TOGGLE OFF (quitar voto)
    const isTogglingOff = previousVote === voteType;
    const nextVote = isTogglingOff ? null : voteType;

    let likeDelta = 0;
    let dislikeDelta = 0;

    if (isTogglingOff) {
      if (previousVote === 'like') likeDelta = -1;
      if (previousVote === 'dislike') dislikeDelta = -1;
    } else if (!previousVote) {
      if (voteType === 'like') likeDelta = 1;
      if (voteType === 'dislike') dislikeDelta = 1;
    } else if (previousVote === 'dislike' && voteType === 'like') {
      likeDelta = 1;
      dislikeDelta = -1;
    } else if (previousVote === 'like' && voteType === 'dislike') {
      likeDelta = -1;
      dislikeDelta = 1;
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

    const finalLikes = backendResult?.likes !== undefined ? backendResult.likes : 0;
    const finalDislikes = backendResult?.dislikes !== undefined ? backendResult.dislikes : 0;

    return {
      success: true,
      id,
      likes: finalLikes,
      dislikes: finalDislikes,
      votos: finalLikes,
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
    return { data: result, source: 'backend' };
  },

  // 5. Eliminar sugerencia directamente en backend
  async deleteSuggestion(id, userRole = 'admin') {
    const headerRole = normalizeRoleForHeader(userRole);
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

    return { success: true, source: 'backend' };
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
      throw error;
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
  },

  async deleteUser(userId, userRole = 'secretaria') {
    const headerRole = normalizeRoleForHeader(userRole);
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
  },

  async updateUserPhoto(userId, photoUrl, userRole = 'secretaria', requesterId = null) {
    const headerRole = normalizeRoleForHeader(userRole);
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
  },

  async updateUser(userId, userData, userRole = 'secretaria') {
    const headerRole = normalizeRoleForHeader(userRole);
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
  },

  // 6. Obtener comentarios de una sugerencia directamente desde backend
  async getComments(sugerenciaId, userRole = 'alumno') {
    const headerRole = normalizeRoleForHeader(userRole);
    const response = await fetch(`${API_BASE_URL}/sugerencias/${sugerenciaId}/comentarios`, {
      method: 'GET',
      headers: { 'x-user-role': headerRole }
    });
    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }
    const data = await response.json();
    const commentList = data.comentarios || data.data || [];
    return { data: commentList, source: 'backend' };
  },

  // 7. Crear comentario en una sugerencia directamente en backend
  async createComment(sugerenciaId, { usuario_id, texto }, userRole = 'alumno') {
    const headerRole = normalizeRoleForHeader(userRole);
    const response = await fetch(`${API_BASE_URL}/sugerencias/${sugerenciaId}/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': headerRole,
        'x-user-id': String(usuario_id)
      },
      body: JSON.stringify({ usuario_id, texto })
    });

    const resData = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(resData.error || `Error ${response.status}`);
      err.status = response.status;
      err.response = { status: response.status, data: resData };
      throw err;
    }

    const createdObj = resData.comentario || resData.data;
    return { data: createdObj, source: 'backend' };
  },

  // 8. Eliminar comentario (Moderación de debate)
  async deleteComment(sugerenciaId, commentId, userRole = 'profesor', userId = null) {
    const headerRole = normalizeRoleForHeader(userRole);
    const headers = {
      'x-user-role': headerRole
    };
    if (userId) {
      headers['x-user-id'] = String(userId);
    }

    let backendDeleted = false;

    // 1. Intentar endpoint anidado canónico: DELETE /sugerencias/:id/comentarios/:comentarioId
    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias/${sugerenciaId}/comentarios/${commentId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        backendDeleted = true;
      } else if (response.status === 404) {
        // 2. Intentar endpoint alternativo plano: DELETE /comentarios/:id
        const fallbackRes = await fetch(`${API_BASE_URL}/comentarios/${commentId}`, {
          method: 'DELETE',
          headers
        });
        if (fallbackRes.ok) {
          backendDeleted = true;
        } else {
          console.warn(`Endpoints DELETE para comentario ${commentId} no implementados en backend (404).`);
        }
      }
    } catch (e) {
      console.warn('Backend desconectado o error de red al intentar DELETE comentario:', e.message);
    }

    // Actualizar caché local de comentarios independientemente para consistencia UI
    const localComments = JSON.parse(localStorage.getItem(`comments_${sugerenciaId}`) || '[]');
    const updated = localComments.filter(c => String(c.id) !== String(commentId));
    localStorage.setItem(`comments_${sugerenciaId}`, JSON.stringify(updated));

    return { success: true, commentId, backendDeleted };
  },

  // 9. Ocultar / Mostrar comentario (Moderación sin borrado)
  async toggleHideComment(sugerenciaId, commentId, isHidden, userRole = 'profesor') {
    const headerRole = normalizeRoleForHeader(userRole);
    try {
      await fetch(`${API_BASE_URL}/sugerencias/${sugerenciaId}/comentarios/${commentId}/ocultar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': headerRole
        },
        body: JSON.stringify({ is_hidden: isHidden })
      });
    } catch (e) {
      console.warn('Backend sin endpoint de ocultar comentario, persistiendo localmente:', e.message);
    }

    const localComments = JSON.parse(localStorage.getItem(`comments_${sugerenciaId}`) || '[]');
    const updated = localComments.map(c => c.id === commentId ? { ...c, is_hidden: isHidden } : c);
    localStorage.setItem(`comments_${sugerenciaId}`, JSON.stringify(updated));

    return { success: true, commentId, is_hidden: isHidden };
  },

  // 10. Conteo rápido de comentarios para una sugerencia
  getCommentCount(sugerenciaId) {
    try {
      const local = JSON.parse(localStorage.getItem(`comments_${sugerenciaId}`) || '[]');
      return local.length;
    } catch {
      return 0;
    }
  }
};

// Función de validación de cédula ecuatoriana (Algoritmo del Módulo 10)
export function validateEcuadorianCedula(cedula) {
  if (!cedula || typeof cedula !== 'string') {
    return { isValid: false, message: 'La cédula es requerida.' };
  }
  const clean = cedula.trim();
  if (!/^\d{10}$/.test(clean)) {
    return { isValid: false, message: 'La cédula debe contener exactamente 10 dígitos numéricos (no letras ni guiones).' };
  }

  // Código de provincia (primeros 2 dígitos entre 01 y 24, o 30 para extranjeros/especiales)
  const province = parseInt(clean.substring(0, 2), 10);
  if ((province < 1 || province > 24) && province !== 30) {
    return { isValid: false, message: 'Código de provincia inválido. Los 2 primeros dígitos deben estar entre 01 y 24.' };
  }

  // Tercer dígito de persona natural debe ser menor a 6 (0 al 5)
  const thirdDigit = parseInt(clean.charAt(2), 10);
  if (thirdDigit >= 6) {
    return { isValid: false, message: 'El tercer dígito de la cédula es inválido para personas naturales.' };
  }

  // Algoritmo Módulo 10
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let val = parseInt(clean.charAt(i), 10) * coefficients[i];
    if (val >= 10) {
      val -= 9;
    }
    sum += val;
  }

  const remainder = sum % 10;
  const verifierDigit = remainder === 0 ? 0 : 10 - remainder;
  const lastDigit = parseInt(clean.charAt(9), 10);

  if (verifierDigit !== lastDigit) {
    return { isValid: false, message: 'Cédula inválida: el décimo dígito verificador no coincide (Algoritmo Módulo 10).' };
  }

  return { isValid: true, message: '' };
}

// Función helper para capitalizar estrictamente roles de usuario
export function formatRole(role) {
  if (!role) return 'Alumno';
  const r = String(role).trim().toLowerCase();
  if (r === 'admin' || r === 'administrador') return 'Administrador';
  if (r === 'profesor' || r === 'docente') return 'Profesor';
  if (r === 'mantenimiento') return 'Mantenimiento';
  if (r === 'secretaria' || r === 'secretaría') return 'Secretaria';
  if (r === 'alumno' || r === 'estudiante') return 'Alumno';
  return r.charAt(0).toUpperCase() + r.slice(1);
}

// Helper para determinar autor, anonimato y etiqueta de 'Usuario eliminado'
export function getAuthorInfo(item, currentUserRole) {
  if (!item) {
    return { name: 'Usuario eliminado', isDeleted: true, isAnonymous: false, avatar: null, canInteract: false, authorId: null };
  }

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'administrador';
  const isAnon = Boolean(item.es_anonimo);

  if (isAnon) {
    if (isAdmin && item.usuarios?.nombre && item.usuarios.nombre !== 'Anónimo') {
      return {
        name: `${item.usuarios.nombre} (Anónimo)`,
        isDeleted: false,
        isAnonymous: true,
        avatar: item.usuarios.foto_url || null,
        canInteract: true,
        authorId: item.usuarios.id || item.usuario_id
      };
    }
    return {
      name: 'Anónimo',
      isDeleted: false,
      isAnonymous: true,
      avatar: null,
      canInteract: false,
      authorId: null
    };
  }

  const u = item.usuarios;
  const hasUserObj = Boolean(u && typeof u === 'object');
  const hasUserId = Boolean(item.usuario_id);

  if (!hasUserObj && !hasUserId) {
    return { name: 'Usuario eliminado', isDeleted: true, isAnonymous: false, avatar: null, canInteract: false, authorId: null };
  }

  const name = u?.nombre;
  if (!name || name === 'Comunidad' || name === 'null' || name.trim() === '') {
    return { name: 'Usuario eliminado', isDeleted: true, isAnonymous: false, avatar: null, canInteract: false, authorId: null };
  }

  return {
    name: name.trim(),
    isDeleted: false,
    isAnonymous: false,
    avatar: u?.foto_url || null,
    canInteract: true,
    authorId: u?.id || item.usuario_id
  };
}


