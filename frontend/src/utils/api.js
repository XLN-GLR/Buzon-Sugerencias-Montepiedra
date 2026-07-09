// frontend/src/utils/api.js

const API_BASE_URL = 'http://127.0.0.1:8080';

// Seed data with metadata encoded in the description
const SEED_SUGGESTIONS = [
  {
    id: 'sug-1',
    created_at: '2026-06-28T14:30:00.000Z',
    titulo: 'Áreas verdes en el patio central',
    categoria: 'Infraestructura',
    descripcion: 'Sería excelente colocar más plantas ornamentales y césped en las zonas de descanso. Ayudaría a tener un ambiente más fresco y agradable durante el recreo.\n[author:Juan Pérez (10mo de Básica)][anon:false]',
    estado: 'Respondido',
    respuesta: '¡Excelente sugerencia! El departamento administrativo ha aprobado un proyecto de jardinería para el patio central. Los trabajos comenzarán la próxima semana.',
    usuario_id: '60685e1f-3d41-42c2-b9a6-d71739856b22'
  },
  {
    id: 'sug-2',
    created_at: '2026-07-01T09:15:00.000Z',
    titulo: 'Actualización de libros en la Biblioteca',
    categoria: 'Academico',
    descripcion: 'Solicito que se adquieran más novelas juveniles y libros actualizados de programación para la biblioteca general. Muchos compañeros están interesados en estos temas.\n[author:Pedro Gómez (8vo de Básica)][anon:true]',
    estado: 'En proceso',
    respuesta: '',
    usuario_id: '71796f2a-4e52-53d3-c0b7-e82840967c33'
  },
  {
    id: 'sug-3',
    created_at: '2026-06-25T11:00:00.000Z',
    titulo: 'Talleres extracurriculares de Robótica',
    categoria: 'Academico',
    descripcion: 'Me gustaría que se abran clubes o talleres de robótica y electrónica los días sábados, para fomentar las habilidades tecnológicas en los estudiantes.\n[author:Andrés Silva (1ro de Bachillerato)][anon:true]',
    estado: 'Respondido',
    respuesta: 'Agradecemos tu iniciativa. A partir del próximo quimestre, implementaremos el taller de robótica los días viernes por la tarde en el laboratorio de computación.',
    usuario_id: '82807g3b-5f63-64e4-d1c8-f93951078d44'
  },
  {
    id: 'sug-4',
    created_at: '2026-07-02T16:45:00.000Z',
    titulo: 'Implementación de más basureros de reciclaje',
    categoria: 'Convivencia',
    descripcion: 'Deberíamos colocar contenedores diferenciados para plástico, papel y orgánicos cerca del bar escolar. Esto nos ayudará a mantener limpio el colegio y cuidar el planeta.\n[author:Comité de Estudiantes][anon:false]',
    estado: 'Pendiente',
    respuesta: '',
    usuario_id: '60685e1f-3d41-42c2-b9a6-d71739856b22'
  }
];

const INITIAL_VOTES = {
  'sug-1': 15,
  'sug-2': 4,
  'sug-3': 12,
  'sug-4': 1
};

// Initialize localStorage if not present
function initLocalStorage() {
  if (!localStorage.getItem('montepiedra_sugerencias')) {
    localStorage.setItem('montepiedra_sugerencias', JSON.stringify(SEED_SUGGESTIONS));
  }
  if (!localStorage.getItem('montepiedra_votos')) {
    localStorage.setItem('montepiedra_votos', JSON.stringify(INITIAL_VOTES));
  }
}

initLocalStorage();

// Parse description metadata
export function parseDescription(desc) {
  if (!desc) return { cleanDesc: '', author: 'Anónimo', isAnonymous: true };
  
  // Regex matches \n[author:xxx][anon:yyy] at the end of string
  const match = desc.match(/\n\[author:(.*?)\]\[anon:(true|false)\]$/);
  if (match) {
    const authorVal = match[1];
    const anonVal = match[2] === 'true';
    const cleanDesc = desc.replace(/\n\[author:(.*?)\]\[anon:(true|false)\]$/, '');
    return { cleanDesc, author: authorVal, isAnonymous: anonVal };
  }
  
  return { cleanDesc: desc, author: 'Anónimo', isAnonymous: true };
}

// Format description with metadata
export function encodeDescription(cleanDesc, author, isAnonymous) {
  return `${cleanDesc}\n[author:${author}][anon:${isAnonymous}]`;
}

// Helper to inject votes and user avatar into suggestions
function mergeLocalVotesAndAvatars(suggestionsList) {
  const votesMap = JSON.parse(localStorage.getItem('montepiedra_votos') || '{}');
  const userProfiles = JSON.parse(localStorage.getItem('montepiedra_user_profiles') || '[]');

  return suggestionsList.map(item => {
    // Inject votes count (fallback to 0)
    const votes = votesMap[item.id] || votesMap[item.created_at] || 0;
    
    // Find author details to display their latest profile picture in the cards
    const { cleanDesc, author: originalAuthor } = parseDescription(item.descripcion);
    const matchedProfile = userProfiles.find(p => p.nombre.toLowerCase() === originalAuthor.toLowerCase());
    const authorAvatar = matchedProfile ? matchedProfile.avatar : null;

    return {
      ...item,
      votos: votes,
      authorAvatar: authorAvatar
    };
  });
}

export const api = {
  // Fetch all suggestions
  async getSuggestions() {
    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias`);
      if (!response.ok) {
        throw new Error(`Error en servidor: ${response.status}`);
      }
      const result = await response.json();
      
      if (result.data) {
        // Cache backend data
        localStorage.setItem('montepiedra_sugerencias', JSON.stringify(result.data));
        const merged = mergeLocalVotesAndAvatars(result.data);
        return { data: merged, source: 'backend' };
      }
      throw new Error("Formato de respuesta incorrecto");
    } catch (error) {
      console.warn("Backend desconectado o error. Usando fallback de localStorage:", error.message);
      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      const merged = mergeLocalVotesAndAvatars(localData);
      return { data: merged, source: 'local' };
    }
  },

  // Create a suggestion
  async createSuggestion(title, description, category, userId) {
    const payload = {
      titulo: title,
      descripcion: description,
      categoria: category,
      usuario_id: userId
    };

    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error en backend: ${response.status}`);
      }
      const result = await response.json();
      
      // Update local suggestions cache
      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      localData.unshift(result.data);
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(localData));

      // Inject vote values into result
      const merged = mergeLocalVotesAndAvatars([result.data]);

      return { data: merged[0], source: 'backend' };
    } catch (error) {
      console.warn("Error al enviar al backend. Guardando localmente:", error.message);
      
      const simulatedData = {
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
        titulo: title,
        descripcion: description,
        categoria: category,
        estado: 'pendiente',
        respuesta: '',
        usuario_id: userId
      };

      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      localData.unshift(simulatedData);
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(localData));

      // Inject vote values into simulated result
      const merged = mergeLocalVotesAndAvatars([simulatedData]);

      return { data: merged[0], source: 'local', isSimulated: true };
    }
  },

  // Delete suggestion
  async deleteSuggestion(id, userRole) {
    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': userRole
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
      console.warn("Error al borrar en el backend. Eliminando localmente:", error.message);
      
      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      const filtered = localData.filter(item => item.id !== id);
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(filtered));
      
      return { success: true, source: 'local', error: error.message };
    }
  },

  // Update suggestion status and response
  async updateSuggestionState(id, newStatus, responseText, userRole) {
    const payload = {
      estado: newStatus,
      respuesta: responseText
    };

    try {
      const response = await fetch(`${API_BASE_URL}/sugerencias/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Ruta de actualización no soportada en backend`);
      }
      
      const result = await response.json();
      
      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      const updated = localData.map(item => {
        if (item.id === id) {
          return { ...item, estado: newStatus, respuesta: responseText };
        }
        return item;
      });
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(updated));

      const merged = mergeLocalVotesAndAvatars([result.data]);
      return { data: merged[0], source: 'backend' };
    } catch (error) {
      console.info("Actualización de estado en backend falló. Guardando localmente (simulado):", error.message);
      
      const localData = JSON.parse(localStorage.getItem('montepiedra_sugerencias') || '[]');
      let updatedObj = null;
      const updated = localData.map(item => {
        if (item.id === id) {
          updatedObj = { ...item, estado: newStatus, respuesta: responseText };
          return updatedObj;
        }
        return item;
      });
      localStorage.setItem('montepiedra_sugerencias', JSON.stringify(updated));

      const merged = mergeLocalVotesAndAvatars([updatedObj]);
      return { data: merged[0], source: 'local', isSimulated: true };
    }
  },

  // Vote for a suggestion (Likes system)
  voteSuggestion(id) {
    const votesMap = JSON.parse(localStorage.getItem('montepiedra_votos') || '{}');
    const currentVotes = votesMap[id] || 0;
    const newVotes = currentVotes + 1;
    votesMap[id] = newVotes;
    localStorage.setItem('montepiedra_votos', JSON.stringify(votesMap));
    return newVotes;
  }
};
