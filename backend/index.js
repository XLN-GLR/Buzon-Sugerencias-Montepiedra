import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { Config } from './config.js';

const app = express();

// Habilitar CORS para permitir peticiones desde el frontend
app.use(cors());

// Middleware para procesar cuerpos de solicitud en formato JSON
app.use(express.json());

// Inicializar cliente de Supabase
const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY);

// Helper para normalizar roles de usuario recibidos en encabezados
const normalizeRole = (role) => {
  if (!role) return 'alumno';
  const r = String(role).trim().toLowerCase();
  if (r === 'admin' || r === 'administrador') return 'admin';
  if (r === 'secretaria' || r === 'secretaría') return 'secretaria';
  if (r === 'mantenimiento') return 'mantenimiento';
  if (r === 'profesor' || r === 'docente') return 'profesor';
  return 'alumno';
};

// Ruta de comprobación de estado
app.get('/', (req, res) => {
  res.json({
    status: "Backend corriendo con Node.js y Express",
    database: "Conectada exitosamente a Supabase"
  });
});

// Listado de palabras prohibidas para moderación de contenido (filtro de lenguaje inapropiado)
const FORBIDDEN_WORDS = [
  'mierda', 'puto', 'puta', 'pendejo', 'pendeja', 'cabron', 'cabrón',
  'estupido', 'estúpido', 'tonto', 'tonta', 'idiota', 'imbecil', 'imbécil',
  'groseria', 'grosería', 'basura', 'hijo de puta', 'malparido', 'culiado'
];

// Función para verificar si un texto contiene lenguaje inapropiado
const hasProfanity = (text) => {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return FORBIDDEN_WORDS.some(word => lower.includes(word));
};

// =======================================================
// MÓDULO 2: BUZÓN DE SUGERENCIAS Y VOTACIONES
// =======================================================

// 1. Ruta para crear una nueva sugerencia
app.post('/sugerencias', async (req, res) => {
  const { titulo, descripcion, categoria, usuario_id, es_anonimo, respuesta_moderador, foto_url } = req.body;

  // Validación de campos requeridos
  if (!titulo || !descripcion || !categoria || !usuario_id) {
    return res.status(400).json({
      error: "Faltan campos obligatorios. Debes proporcionar: titulo, descripcion, categoria y usuario_id."
    });
  }

  // Validación de lenguaje inapropiado
  if (hasProfanity(titulo) || hasProfanity(descripcion)) {
    return res.status(400).json({
      error: "Contenido inapropiado detectado. Por favor, modifique su lenguaje."
    });
  }

  try {
    // Inserción en la tabla sugerencias de Supabase con likes y dislikes en 0
    const { data, error } = await supabase
      .from('sugerencias')
      .insert([
        {
          titulo: String(titulo).trim(),
          descripcion: String(descripcion).trim(),
          categoria: String(categoria).trim(),
          usuario_id: String(usuario_id).trim(),
          estado: 'pendiente',
          es_anonimo: Boolean(es_anonimo),
          likes: 0,
          dislikes: 0,
          respuesta_moderador: respuesta_moderador ? String(respuesta_moderador).trim() : null,
          foto_url: foto_url ? String(foto_url).trim() : null
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    const createdRecord = data[0];

    return res.status(201).json({
      message: "Sugerencia creada exitosamente",
      data: {
        ...createdRecord,
        votos: createdRecord.likes ?? 0
      }
    });
  } catch (error) {
    console.error("Error al insertar sugerencia en Supabase:", error);
    return res.status(500).json({
      error: "Error interno del servidor al crear la sugerencia",
      details: error.message
    });
  }
});

// 2. Ruta para obtener todas las sugerencias con estado del voto del usuario activo
app.get('/sugerencias', async (req, res) => {
  const rawRole = req.headers['x-user-role'];
  const userRole = normalizeRole(rawRole);
  const rawUserId = req.headers['x-user-id'] || req.query.usuario_id;
  const currentUserId = rawUserId && rawUserId !== 'undefined' && rawUserId !== 'null' ? String(rawUserId).trim() : null;

  try {
    const { data, error } = await supabase
      .from('sugerencias')
      .select('*, usuarios (id, nombre, correo, foto_url)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Obtener mapa de votos del usuario actual si se proporcionó un ID de usuario válido
    let userVotesMap = {};
    if (currentUserId) {
      const { data: votosUsuario, error: votosError } = await supabase
        .from('votos_sugerencias')
        .select('sugerencia_id, tipo_voto')
        .eq('usuario_id', currentUserId);

      if (!votosError && votosUsuario) {
        votosUsuario.forEach(v => {
          userVotesMap[v.sugerencia_id] = v.tipo_voto;
        });
      }
    }

    // Aplicar regla de privacidad para sugerencias anónimas y estructurar el retorno exacto
    const processedData = data.map(sugerencia => {
      let usuarioInfo = sugerencia.usuarios;
      if (Array.isArray(usuarioInfo)) {
        usuarioInfo = usuarioInfo[0] || null;
      }

      // Preparar objeto de autor real
      let usuarioFinal = {
        id: usuarioInfo ? usuarioInfo.id : null,
        nombre: usuarioInfo ? usuarioInfo.nombre : "Anónimo",
        correo: usuarioInfo ? usuarioInfo.correo : "anonimo@montepiedra.edu.ec",
        foto_url: usuarioInfo ? usuarioInfo.foto_url : null
      };

      // Si es anónimo y el consultor NO es admin, se oculta la identidad
      if (sugerencia.es_anonimo && userRole !== 'admin') {
        usuarioFinal = {
          id: null,
          nombre: "Anónimo",
          correo: "anonimo@montepiedra.edu.ec",
          foto_url: null
        };
      }

      const likesCount = sugerencia.likes ?? 0;
      const dislikesCount = sugerencia.dislikes ?? 0;

      return {
        id: sugerencia.id,
        created_at: sugerencia.created_at,
        titulo: sugerencia.titulo,
        descripcion: sugerencia.descripcion,
        categoria: sugerencia.categoria,
        es_anonimo: Boolean(sugerencia.es_anonimo),
        votos: likesCount,
        likes: likesCount,
        dislikes: dislikesCount,
        estado: sugerencia.estado || 'pendiente',
        respuesta_moderador: sugerencia.respuesta_moderador || null,
        foto_url: sugerencia.foto_url || null,
        usuario_id: sugerencia.usuario_id,
        user_vote: userVotesMap[sugerencia.id] || null,
        usuarios: usuarioFinal
      };
    });

    return res.status(200).json({
      message: "Sugerencias recuperadas exitosamente",
      data: processedData
    });
  } catch (error) {
    console.error("Error al obtener sugerencias de Supabase:", error);
    return res.status(500).json({
      error: "Error interno del servidor al obtener las sugerencias",
      details: error.message
    });
  }
});

// 3. Ruta para registrar / alternar un voto (Likes / Dislikes con Toggle y desmarcado)
app.post('/sugerencias/:id/votar', async (req, res) => {
  const { id } = req.params;
  const { usuario_id, tipo_voto } = req.body;

  // Validación de campos obligatorios
  if (!usuario_id || typeof usuario_id !== 'string' || !usuario_id.trim()) {
    return res.status(400).json({
      error: "El campo 'usuario_id' es obligatorio."
    });
  }

  if (!tipo_voto || (tipo_voto !== 'like' && tipo_voto !== 'dislike')) {
    return res.status(400).json({
      error: "El campo 'tipo_voto' es inválido. Debe ser 'like' o 'dislike'."
    });
  }

  const userIdClean = usuario_id.trim();

  try {
    // 1. Verificar existencia de la sugerencia en Supabase
    const { data: sugerencia, error: fetchSugerenciaError } = await supabase
      .from('sugerencias')
      .select('id, likes, dislikes')
      .eq('id', id)
      .maybeSingle();

    if (fetchSugerenciaError) {
      console.error("Error al consultar sugerencia en Supabase:", fetchSugerenciaError);
      return res.status(500).json({
        error: "Error interno del servidor al consultar la sugerencia",
        details: fetchSugerenciaError.message
      });
    }

    if (!sugerencia) {
      return res.status(404).json({
        error: "La sugerencia especificada no existe."
      });
    }

    // 2. Consultar si el usuario ya emitió un voto previo en esta sugerencia
    const { data: votoExistente, error: fetchVotoError } = await supabase
      .from('votos_sugerencias')
      .select('id, tipo_voto')
      .eq('sugerencia_id', id)
      .eq('usuario_id', userIdClean)
      .maybeSingle();

    if (fetchVotoError) {
      console.error("Error al verificar voto previo en Supabase:", fetchVotoError);
      return res.status(500).json({
        error: "Error interno del servidor al verificar el voto",
        details: fetchVotoError.message
      });
    }

    let currentLikes = sugerencia.likes || 0;
    let currentDislikes = sugerencia.dislikes || 0;
    let nuevoTipoVoto = tipo_voto;

    // CASO A: TOGGLE OFF (Quitar voto si hace clic en la misma opción)
    if (votoExistente && votoExistente.tipo_voto === tipo_voto) {
      await supabase
        .from('votos_sugerencias')
        .delete()
        .eq('id', votoExistente.id);

      if (tipo_voto === 'like') {
        currentLikes = Math.max(0, currentLikes - 1);
      } else {
        currentDislikes = Math.max(0, currentDislikes - 1);
      }
      nuevoTipoVoto = null;
    } 
    // CASO B: SWITCH VOTE (Cambiar de Like a Dislike o viceversa)
    else if (votoExistente && votoExistente.tipo_voto !== tipo_voto) {
      await supabase
        .from('votos_sugerencias')
        .update({ tipo_voto })
        .eq('id', votoExistente.id);

      if (tipo_voto === 'like') {
        currentLikes = currentLikes + 1;
        currentDislikes = Math.max(0, currentDislikes - 1);
      } else {
        currentDislikes = currentDislikes + 1;
        currentLikes = Math.max(0, currentLikes - 1);
      }
    } 
    // CASO C: NUEVO VOTO
    else {
      await supabase
        .from('votos_sugerencias')
        .insert([
          {
            sugerencia_id: id,
            usuario_id: userIdClean,
            tipo_voto: tipo_voto
          }
        ]);

      if (tipo_voto === 'like') {
        currentLikes = currentLikes + 1;
      } else {
        currentDislikes = currentDislikes + 1;
      }
    }

    // 3. Actualizar contadores 'likes' y 'dislikes' en la tabla sugerencias
    const { data: updatedData, error: updateError } = await supabase
      .from('sugerencias')
      .update({ likes: currentLikes, dislikes: currentDislikes })
      .eq('id', id)
      .select('id, likes, dislikes')
      .single();

    if (updateError) {
      console.error("Error al actualizar contadores en sugerencias:", updateError);
      return res.status(500).json({
        error: "Error interno del servidor al actualizar los contadores de la sugerencia",
        details: updateError.message
      });
    }

    return res.status(200).json({
      message: nuevoTipoVoto ? "Voto registrado exitosamente" : "Voto removido exitosamente",
      id: updatedData.id,
      votos: updatedData.likes,
      likes: updatedData.likes,
      dislikes: updatedData.dislikes,
      currentVote: nuevoTipoVoto
    });
  } catch (error) {
    console.error("Error inesperado en /sugerencias/:id/votar:", error);
    return res.status(500).json({
      error: "Error interno del servidor al registrar el voto",
      details: error.message
    });
  }
});

// 4. Ruta para moderar una sugerencia (cambiar estado y agregar respuesta)
app.patch('/sugerencias/:id/moderacion', async (req, res) => {
  const { id } = req.params;
  const rawRole = req.headers['x-user-role'];
  const userRole = normalizeRole(rawRole);
  const { estado, respuesta_moderador } = req.body;

  // Lógica de control de acceso (Profesor, Admin o Mantenimiento)
  if (userRole !== 'profesor' && userRole !== 'admin' && userRole !== 'mantenimiento') {
    return res.status(403).json({
      error: "Acceso denegado. No tienes permisos de moderación."
    });
  }

  try {
    const { data: sugerencia, error: fetchError } = await supabase
      .from('sugerencias')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !sugerencia) {
      return res.status(404).json({
        error: "La sugerencia especificada no existe."
      });
    }

    const updatePayload = {};
    if (estado !== undefined) updatePayload.estado = estado;
    if (respuesta_moderador !== undefined) updatePayload.respuesta_moderador = respuesta_moderador;

    const { data: updatedData, error: updateError } = await supabase
      .from('sugerencias')
      .update(updatePayload)
      .eq('id', id)
      .select('id, estado, respuesta_moderador')
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      message: "Sugerencia moderada exitosamente",
      id: updatedData.id,
      estado: updatedData.estado,
      respuesta_moderador: updatedData.respuesta_moderador
    });
  } catch (error) {
    console.error("Error al moderar sugerencia en Supabase:", error);
    return res.status(500).json({
      error: "Error interno del servidor al moderar la sugerencia",
      details: error.message
    });
  }
});

// 5. Ruta para eliminar una sugerencia por su ID (Admin o Mantenimiento para sus asignaciones)
app.delete('/sugerencias/:id', async (req, res) => {
  const { id } = req.params;
  const userRole = normalizeRole(req.headers['x-user-role']);

  if (userRole !== 'admin' && userRole !== 'mantenimiento') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren privilegios de administrador o mantenimiento."
    });
  }

  try {
    const { data, error } = await supabase
      .from('sugerencias')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: "No se encontró ninguna sugerencia con el ID proporcionado."
      });
    }

    return res.status(200).json({
      message: "Sugerencia eliminada exitosamente",
      data: data[0]
    });
  } catch (error) {
    console.error("Error al eliminar sugerencia en Supabase:", error);
    return res.status(500).json({
      error: "Error interno del servidor al eliminar la sugerencia",
      details: error.message
    });
  }
});

// 6. Ruta para obtener todos los comentarios de una sugerencia
app.get('/sugerencias/:id/comentarios', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('comentarios_sugerencias')
      .select('id, sugerencia_id, usuario_id, texto, created_at, usuarios (id, nombre, foto_url, rol)')
      .eq('sugerencia_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn(`Advertencia al obtener comentarios para la sugerencia ${id}:`, error.message);
      // Retornar array vacío para resiliencia del frontend
      return res.status(200).json({
        message: "No se pudieron obtener comentarios de la base de datos.",
        comentarios: [],
        data: []
      });
    }

    const processedData = (data || []).map(comentario => {
      let usuarioInfo = comentario.usuarios;
      if (Array.isArray(usuarioInfo)) {
        usuarioInfo = usuarioInfo[0] || null;
      }
      return {
        id: comentario.id,
        sugerencia_id: comentario.sugerencia_id,
        usuario_id: comentario.usuario_id,
        texto: comentario.texto,
        created_at: comentario.created_at,
        usuarios: usuarioInfo ? {
          id: usuarioInfo.id,
          nombre: usuarioInfo.nombre,
          foto_url: usuarioInfo.foto_url,
          rol: usuarioInfo.rol
        } : null
      };
    });

    return res.status(200).json({
      message: "Comentarios recuperados exitosamente",
      comentarios: processedData,
      data: processedData
    });
  } catch (error) {
    console.error("Error inesperado en GET /sugerencias/:id/comentarios:", error);
    // Bloque try/catch resiliente que retorna array vacío
    return res.status(200).json({
      message: "Error al recuperar los comentarios",
      comentarios: [],
      data: []
    });
  }
});

// 7. Ruta para agregar un nuevo comentario a una sugerencia
app.post('/sugerencias/:id/comentarios', async (req, res) => {
  const { id } = req.params;
  const { usuario_id, texto } = req.body;

  // Validación de campos obligatorios
  if (!usuario_id || typeof usuario_id !== 'string' || !usuario_id.trim() ||
      !texto || typeof texto !== 'string' || !texto.trim()) {
    return res.status(400).json({
      error: "Faltan campos obligatorios. Debes proporcionar usuario_id y texto."
    });
  }

  const cleanTexto = String(texto).trim();
  const cleanUsuarioId = String(usuario_id).trim();

  // Validación de lenguaje inapropiado
  if (hasProfanity(cleanTexto)) {
    return res.status(400).json({
      error: "Contenido inapropiado detectado en el comentario. Por favor, modifique su lenguaje."
    });
  }

  try {
    // 1. Verificar si la sugerencia existe
    const { data: sugerencia, error: sugError } = await supabase
      .from('sugerencias')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (sugError || !sugerencia) {
      return res.status(404).json({
        error: "La sugerencia especificada no existe."
      });
    }

    // 2. Insertar el comentario en Supabase haciendo join con la tabla usuarios
    const { data, error } = await supabase
      .from('comentarios_sugerencias')
      .insert([
        {
          sugerencia_id: id,
          usuario_id: cleanUsuarioId,
          texto: cleanTexto
        }
      ])
      .select('id, sugerencia_id, usuario_id, texto, created_at, usuarios (id, nombre, foto_url, rol)')
      .single();

    if (error) {
      console.error("Error al insertar comentario en Supabase:", error);
      return res.status(500).json({
        error: "Error interno del servidor al crear el comentario",
        details: error.message
      });
    }

    let usuarioInfo = data.usuarios;
    if (Array.isArray(usuarioInfo)) {
      usuarioInfo = usuarioInfo[0] || null;
    }

    const createdComment = {
      id: data.id,
      sugerencia_id: data.sugerencia_id,
      usuario_id: data.usuario_id,
      texto: data.texto,
      created_at: data.created_at,
      usuarios: usuarioInfo ? {
        id: usuarioInfo.id,
        nombre: usuarioInfo.nombre,
        foto_url: usuarioInfo.foto_url,
        rol: usuarioInfo.rol
      } : null
    };

    return res.status(201).json({
      message: "Comentario creado exitosamente",
      comentario: createdComment,
      data: createdComment
    });
  } catch (error) {
    console.error("Error inesperado en POST /sugerencias/:id/comentarios:", error);
    return res.status(500).json({
      error: "Error interno del servidor al crear el comentario",
      details: error.message
    });
  }
});

// =======================================================
// MÓDULO 3: SECRETARÍA (GESTIÓN DE NÓMINAS Y USUARIOS)
// =======================================================

// 1. Ruta para registro masivo de usuarios (Nómina institucional)
app.post('/usuarios/registro-masivo', async (req, res) => {
  const userRole = normalizeRole(req.headers['x-user-role']);

  if (userRole !== 'secretaria' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador."
    });
  }

  const { nomina } = req.body;

  if (!nomina || !Array.isArray(nomina) || nomina.length === 0) {
    return res.status(400).json({
      error: "El campo 'nomina' es obligatorio y debe ser un arreglo con al menos un usuario."
    });
  }

  for (let i = 0; i < nomina.length; i++) {
    const item = nomina[i];
    if (!item.cedula || !item.nombre || !item.correo) {
      return res.status(400).json({
        error: `El usuario en la posición ${i + 1} no cuenta con todos los campos obligatorios ('cedula', 'nombre', 'correo').`
      });
    }
  }

  try {
    const saltRounds = 10;

    const usuariosParaInsertar = await Promise.all(
      nomina.map(async (usuario) => {
        const hashedPassword = await bcrypt.hash(String(usuario.cedula).trim(), saltRounds);
        return {
          cedula: String(usuario.cedula).trim(),
          nombre: String(usuario.nombre).trim(),
          correo: String(usuario.correo).trim(),
          rol: usuario.rol ? String(usuario.rol).trim().toLowerCase() : 'alumno',
          password: hashedPassword,
          es_primer_ingreso: true,
          foto_url: usuario.foto_url ? String(usuario.foto_url).trim() : null
        };
      })
    );

    const { data: usuariosInsertados, error: insertError } = await supabase
      .from('usuarios')
      .insert(usuariosParaInsertar)
      .select('id, cedula, nombre, correo, rol, es_primer_ingreso, foto_url, created_at');

    if (insertError) {
      console.error("Error al registrar nómina masiva en Supabase:", insertError);
      return res.status(500).json({
        error: "Error interno del servidor al registrar la nómina en la base de datos",
        details: insertError.message
      });
    }

    return res.status(201).json({
      message: "Nómina de usuarios registrada exitosamente",
      total_registrados: usuariosInsertados.length,
      usuarios: usuariosInsertados
    });
  } catch (error) {
    console.error("Error inesperado en /usuarios/registro-masivo:", error);
    return res.status(500).json({
      error: "Error interno del servidor al procesar el registro masivo",
      details: error.message
    });
  }
});

// 2. Ruta para registro individual manual de usuarios
app.post('/usuarios', async (req, res) => {
  const userRole = normalizeRole(req.headers['x-user-role']);

  if (userRole !== 'secretaria' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador."
    });
  }

  const { cedula, nombre, correo, rol, foto_url } = req.body;

  if (!cedula || typeof cedula !== 'string' || !cedula.trim()) {
    return res.status(400).json({
      error: "El campo 'cedula' es obligatorio."
    });
  }

  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({
      error: "El campo 'nombre' es obligatorio."
    });
  }

  if (!correo || typeof correo !== 'string' || !correo.trim()) {
    return res.status(400).json({
      error: "El campo 'correo' es obligatorio."
    });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(cedula.trim(), saltRounds);

    const { data: nuevoUsuario, error: insertError } = await supabase
      .from('usuarios')
      .insert([
        {
          cedula: cedula.trim(),
          nombre: nombre.trim(),
          correo: correo.trim(),
          rol: rol ? String(rol).trim().toLowerCase() : 'alumno',
          password: hashedPassword,
          es_primer_ingreso: true,
          foto_url: foto_url ? String(foto_url).trim() : null
        }
      ])
      .select('id, cedula, nombre, correo, rol, es_primer_ingreso, foto_url, created_at')
      .single();

    if (insertError) {
      console.error("Error al registrar usuario en Supabase:", insertError);
      return res.status(500).json({
        error: "Error interno del servidor al crear el usuario",
        details: insertError.message
      });
    }

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      usuario: nuevoUsuario
    });
  } catch (error) {
    console.error("Error inesperado en POST /usuarios:", error);
    return res.status(500).json({
      error: "Error interno del servidor al procesar el registro del usuario",
      details: error.message
    });
  }
});

// 3. Ruta para obtener usuarios (con filtro opcional por query ?rol=valor)
app.get('/usuarios', async (req, res) => {
  const userRole = normalizeRole(req.headers['x-user-role']);

  if (userRole !== 'secretaria' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador."
    });
  }

  const { rol } = req.query;

  try {
    let query = supabase
      .from('usuarios')
      .select('id, cedula, nombre, correo, rol, foto_url, es_primer_ingreso, created_at')
      .order('nombre', { ascending: true });

    if (rol && typeof rol === 'string' && rol.trim()) {
      query = query.eq('rol', rol.trim().toLowerCase());
    }

    const { data: usuarios, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error al obtener usuarios de Supabase:", fetchError);
      return res.status(500).json({
        error: "Error interno del servidor al obtener los usuarios",
        details: fetchError.message
      });
    }

    return res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error inesperado en GET /usuarios:", error);
    return res.status(500).json({
      error: "Error interno del servidor al obtener los usuarios",
      details: error.message
    });
  }
});

// 4. Ruta para actualizar la foto de perfil de un estudiante o usuario
app.put('/usuarios/:id/foto', async (req, res) => {
  const { id } = req.params;
  const userRole = normalizeRole(req.headers['x-user-role']);
  const requesterId = req.headers['x-user-id'];
  const { foto_url } = req.body;

  // Permiso: administración, secretaría o el propio usuario autenticado
  const isAuthorized = 
    userRole === 'secretaria' || 
    userRole === 'admin' || 
    (requesterId && String(requesterId).trim() === String(id).trim());

  if (!isAuthorized) {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador para modificar este usuario."
    });
  }

  try {
    const { data: usuario, error: fetchError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !usuario) {
      return res.status(404).json({
        error: "El usuario especificado no existe."
      });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('usuarios')
      .update({ foto_url: foto_url || null })
      .eq('id', id)
      .select('id, cedula, nombre, correo, rol, foto_url, es_primer_ingreso, created_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      message: "Foto de perfil actualizada exitosamente",
      id: updatedUser.id,
      foto_url: updatedUser.foto_url,
      usuario: updatedUser
    });
  } catch (error) {
    console.error("Error al actualizar foto de perfil en Supabase:", error);
    return res.status(500).json({
      error: "Error interno del servidor al actualizar la foto de perfil",
      details: error.message
    });
  }
});

// 5. Ruta para actualizar la información completa de un usuario
app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const userRole = normalizeRole(req.headers['x-user-role']);
  const requesterId = req.headers['x-user-id'];
  const { nombre, cedula, correo, rol, foto_url, password } = req.body;

  const isSelf = requesterId && String(requesterId).trim() === String(id).trim();
  const isAdminOrSecretaria = userRole === 'secretaria' || userRole === 'admin';

  if (!isAdminOrSecretaria && !isSelf) {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador."
    });
  }

  try {
    const updatePayload = {};
    if (nombre !== undefined) updatePayload.nombre = String(nombre).trim();
    if (correo !== undefined) updatePayload.correo = String(correo).trim();
    if (foto_url !== undefined) updatePayload.foto_url = foto_url;
    
    // Modificaciones administrativas restringidas
    if (isAdminOrSecretaria) {
      if (cedula !== undefined) updatePayload.cedula = String(cedula).trim();
      if (rol !== undefined) updatePayload.rol = String(rol).trim().toLowerCase();
    }

    // Si se pasa contraseña nueva, se cifra
    if (password !== undefined && String(password).trim()) {
      const saltRounds = 10;
      updatePayload.password = await bcrypt.hash(String(password).trim(), saltRounds);
      updatePayload.es_primer_ingreso = false;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('usuarios')
      .update(updatePayload)
      .eq('id', id)
      .select('id, cedula, nombre, correo, rol, foto_url, es_primer_ingreso, created_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      message: "Usuario actualizado exitosamente",
      usuario: updatedUser
    });
  } catch (error) {
    console.error("Error al actualizar usuario en Supabase:", error);
    return res.status(500).json({
      error: "Error interno del servidor al actualizar el usuario",
      details: error.message
    });
  }
});

// 6. Ruta para eliminar un usuario por su ID
app.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const userRole = normalizeRole(req.headers['x-user-role']);

  if (userRole !== 'secretaria' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador."
    });
  }

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id)
      .select('id, cedula, nombre, correo, rol');

    if (error) {
      console.error("Error al eliminar usuario en Supabase:", error);
      return res.status(500).json({
        error: "Error interno del servidor al eliminar el usuario",
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: "No se encontró ningún usuario con el ID proporcionado."
      });
    }

    return res.status(200).json({
      message: "Usuario eliminado exitosamente",
      usuario: data[0]
    });
  } catch (error) {
    console.error("Error inesperado en DELETE /usuarios/:id:", error);
    return res.status(500).json({
      error: "Error interno del servidor al eliminar el usuario",
      details: error.message
    });
  }
});

// =======================================================
// MÓDULO 1: AUTENTICACIÓN Y PRIMER INGRESO
// =======================================================

// 1. Ruta para inicio de sesión (Login de usuarios)
app.post('/auth/login', async (req, res) => {
  const { cedula, password } = req.body;

  if (!cedula || typeof cedula !== 'string' || !cedula.trim()) {
    return res.status(400).json({
      error: "El campo 'cedula' es obligatorio."
    });
  }

  try {
    const { data: usuario, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, cedula, nombre, correo, rol, foto_url, password, es_primer_ingreso')
      .eq('cedula', cedula.trim())
      .maybeSingle();

    if (fetchError) {
      console.error("Error al consultar usuario en Supabase:", fetchError);
      return res.status(500).json({
        error: "Error interno del servidor al consultar el usuario",
        details: fetchError.message
      });
    }

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado. Verifique la cédula ingresada."
      });
    }

    // Caso Primer Ingreso: requerir configuración de contraseña
    if (usuario.es_primer_ingreso) {
      return res.status(200).json({
        message: "Primer ingreso detectado. Se requiere configurar la contraseña.",
        requiere_configuracion: true,
        usuario: {
          id: usuario.id,
          cedula: usuario.cedula,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
          foto_url: usuario.foto_url
        }
      });
    }

    // Caso Ingreso Regular: validar contraseña con hash en BD
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({
        error: "El campo 'password' es obligatorio para el inicio de sesión regular."
      });
    }

    if (!usuario.password) {
      return res.status(401).json({
        error: "El usuario no tiene una contraseña configurada. Comuníquese con la administración."
      });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({
        error: "Credenciales inválidas. Contraseña incorrecta."
      });
    }

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      requiere_configuracion: false,
      usuario: {
        id: usuario.id,
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        foto_url: usuario.foto_url
      }
    });
  } catch (error) {
    console.error("Error inesperado en /auth/login:", error);
    return res.status(500).json({
      error: "Error interno del servidor durante la autenticación",
      details: error.message
    });
  }
});

// 2. Ruta para configurar la contraseña en el primer ingreso
app.post('/auth/primer-ingreso', async (req, res) => {
  const { cedula, nueva_password, conservar_cedula } = req.body;

  if (!cedula || typeof cedula !== 'string' || !cedula.trim()) {
    return res.status(400).json({
      error: "El campo 'cedula' es obligatorio."
    });
  }

  const conservarCedulaComoPassword = Boolean(conservar_cedula);
  if (!conservarCedulaComoPassword && (!nueva_password || typeof nueva_password !== 'string' || !nueva_password.trim())) {
    return res.status(400).json({
      error: "Debe proporcionar el campo 'nueva_password' o marcar 'conservar_cedula' como verdadero."
    });
  }

  try {
    const { data: usuario, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, cedula, es_primer_ingreso')
      .eq('cedula', cedula.trim())
      .maybeSingle();

    if (fetchError) {
      console.error("Error al consultar usuario en Supabase:", fetchError);
      return res.status(500).json({
        error: "Error interno del servidor al consultar el usuario",
        details: fetchError.message
      });
    }

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado. Verifique la cédula proporcionada."
      });
    }

    const passwordAEncriptar = conservarCedulaComoPassword ? cedula.trim() : nueva_password.trim();
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(passwordAEncriptar, saltRounds);

    const { data: updatedData, error: updateError } = await supabase
      .from('usuarios')
      .update({
        password: hashedPassword,
        es_primer_ingreso: false
      })
      .eq('id', usuario.id)
      .select('id, cedula, nombre, correo, rol, foto_url, created_at')
      .single();

    if (updateError) {
      console.error("Error al actualizar contraseña en Supabase:", updateError);
      return res.status(500).json({
        error: "Error al actualizar la contraseña del usuario en la base de datos",
        details: updateError.message
      });
    }

    return res.status(200).json({
      message: "Contraseña configurada exitosamente. Ya puede iniciar sesión.",
      usuario: updatedData
    });
  } catch (error) {
    console.error("Error inesperado en /auth/primer-ingreso:", error);
    return res.status(500).json({
      error: "Error interno del servidor al procesar el primer ingreso",
      details: error.message
    });
  }
});

// =======================================================
// MÓDULO 4: MANTENIMIENTO Y SEGUIMIENTO DE TAREAS
// =======================================================

// 1. Ruta para obtener sugerencias asignadas a mantenimiento (Aprobadas e Infraestructura)
app.get('/sugerencias/mantenimiento', async (req, res) => {
  const userRole = normalizeRole(req.headers['x-user-role']);

  if (userRole !== 'mantenimiento' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de mantenimiento o administrador."
    });
  }

  try {
    const { data, error } = await supabase
      .from('sugerencias')
      .select('*, usuarios (id, nombre, correo, foto_url)')
      .eq('estado', 'aprobada')
      .eq('categoria', 'Infraestructura')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error al obtener sugerencias de mantenimiento en Supabase:", error);
      return res.status(500).json({
        error: "Error interno del servidor al obtener las sugerencias de mantenimiento",
        details: error.message
      });
    }

    const processedData = data.map(sugerencia => {
      let usuarioInfo = sugerencia.usuarios;
      if (Array.isArray(usuarioInfo)) {
        usuarioInfo = usuarioInfo[0] || null;
      }

      const likesCount = sugerencia.likes ?? 0;
      const dislikesCount = sugerencia.dislikes ?? 0;

      return {
        id: sugerencia.id,
        created_at: sugerencia.created_at,
        titulo: sugerencia.titulo,
        descripcion: sugerencia.descripcion,
        categoria: sugerencia.categoria,
        es_anonimo: Boolean(sugerencia.es_anonimo),
        votos: likesCount,
        likes: likesCount,
        dislikes: dislikesCount,
        estado: sugerencia.estado,
        respuesta_moderador: sugerencia.respuesta_moderador || null,
        foto_url: sugerencia.foto_url || null,
        usuario_id: sugerencia.usuario_id,
        usuarios: usuarioInfo ? {
          id: usuarioInfo.id,
          nombre: usuarioInfo.nombre,
          correo: usuarioInfo.correo,
          foto_url: usuarioInfo.foto_url
        } : null
      };
    });

    return res.status(200).json({
      message: "Sugerencias de mantenimiento recuperadas exitosamente",
      data: processedData
    });
  } catch (error) {
    console.error("Error inesperado en GET /sugerencias/mantenimiento:", error);
    return res.status(500).json({
      error: "Error interno del servidor al obtener las sugerencias de mantenimiento",
      details: error.message
    });
  }
});

// 2. Ruta para actualizar el estado de una sugerencia (ej. en_proceso, realizada)
app.patch('/sugerencias/:id/estado', async (req, res) => {
  const { id } = req.params;
  const userRole = normalizeRole(req.headers['x-user-role']);
  const { estado } = req.body;

  if (userRole !== 'mantenimiento' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de mantenimiento o administrador."
    });
  }

  if (!estado || typeof estado !== 'string' || !estado.trim()) {
    return res.status(400).json({
      error: "El campo 'estado' es obligatorio."
    });
  }

  try {
    const { data: updatedData, error: updateError } = await supabase
      .from('sugerencias')
      .update({ estado: estado.trim() })
      .eq('id', id)
      .select('id, titulo, estado, categoria')
      .maybeSingle();

    if (updateError) {
      console.error("Error al actualizar estado en Supabase:", updateError);
      return res.status(500).json({
        error: "Error interno del servidor al actualizar el estado de la sugerencia",
        details: updateError.message
      });
    }

    if (!updatedData) {
      return res.status(404).json({
        error: "La sugerencia especificada no existe."
      });
    }

    return res.status(200).json({
      message: "Estado de la sugerencia actualizado exitosamente",
      id: updatedData.id,
      estado: updatedData.estado,
      data: updatedData
    });
  } catch (error) {
    console.error("Error inesperado en PATCH /sugerencias/:id/estado:", error);
    return res.status(500).json({
      error: "Error interno del servidor al actualizar el estado de la sugerencia",
      details: error.message
    });
  }
});

// 3. Ruta para obtener todas las tareas de mantenimiento
app.get('/mantenimiento/tareas', async (req, res) => {
  const userRole = normalizeRole(req.headers['x-user-role']);

  if (userRole !== 'mantenimiento' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de mantenimiento o administrador."
    });
  }

  try {
    const { data: tareas, error } = await supabase
      .from('tareas_mantenimiento')
      .select('*, sugerencias (id, titulo, categoria, estado), usuarios:creado_por (id, nombre, correo)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error al obtener tareas de mantenimiento:", error);
      return res.status(500).json({
        error: "Error interno al obtener las tareas de mantenimiento",
        details: error.message
      });
    }

    return res.status(200).json({
      message: "Tareas de mantenimiento obtenidas exitosamente",
      tareas
    });
  } catch (error) {
    console.error("Error inesperado en GET /mantenimiento/tareas:", error);
    return res.status(500).json({
      error: "Error interno del servidor al obtener las tareas",
      details: error.message
    });
  }
});

// 4. Ruta para crear una nueva tarea de mantenimiento
app.post('/mantenimiento/tareas', async (req, res) => {
  const userRole = normalizeRole(req.headers['x-user-role']);

  if (userRole !== 'mantenimiento' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de mantenimiento o administrador."
    });
  }

  const { sugerencia_id, titulo, creado_por } = req.body;

  if (!sugerencia_id || typeof sugerencia_id !== 'string' || !sugerencia_id.trim()) {
    return res.status(400).json({
      error: "El campo 'sugerencia_id' es obligatorio."
    });
  }

  if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
    return res.status(400).json({
      error: "El campo 'titulo' es obligatorio."
    });
  }

  if (!creado_por || typeof creado_por !== 'string' || !creado_por.trim()) {
    return res.status(400).json({
      error: "El campo 'creado_por' es obligatorio."
    });
  }

  try {
    const { data: nuevaTarea, error: insertError } = await supabase
      .from('tareas_mantenimiento')
      .insert([
        {
          sugerencia_id: sugerencia_id.trim(),
          titulo: titulo.trim(),
          creado_por: creado_por.trim(),
          estado: 'en_proceso'
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error al registrar tarea de mantenimiento en Supabase:", insertError);
      return res.status(500).json({
        error: "Error interno del servidor al registrar la tarea de mantenimiento",
        details: insertError.message
      });
    }

    return res.status(201).json({
      message: "Tarea de mantenimiento creada exitosamente",
      tarea: nuevaTarea
    });
  } catch (error) {
    console.error("Error inesperado en POST /mantenimiento/tareas:", error);
    return res.status(500).json({
      error: "Error interno del servidor al crear la tarea de mantenimiento",
      details: error.message
    });
  }
});

// 5. Ruta para eliminar una tarea de mantenimiento por su ID
app.delete('/mantenimiento/tareas/:id', async (req, res) => {
  const { id } = req.params;
  const userRole = normalizeRole(req.headers['x-user-role']);

  if (userRole !== 'mantenimiento' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de mantenimiento o administrador."
    });
  }

  try {
    const { data, error } = await supabase
      .from('tareas_mantenimiento')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error al eliminar tarea de mantenimiento en Supabase:", error);
      return res.status(500).json({
        error: "Error interno del servidor al eliminar la tarea de mantenimiento",
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: "No se encontró ninguna tarea de mantenimiento con el ID proporcionado."
      });
    }

    return res.status(200).json({
      message: "Tarea de mantenimiento eliminada exitosamente",
      tarea: data[0]
    });
  } catch (error) {
    console.error("Error inesperado en DELETE /mantenimiento/tareas/:id:", error);
    return res.status(500).json({
      error: "Error interno del servidor al eliminar la tarea de mantenimiento",
      details: error.message
    });
  }
});

// Iniciar servidor en el puerto y host configurados
app.listen(Config.PORT, Config.HOST, () => {
  console.log(`Servidor backend listo en http://${Config.HOST}:${Config.PORT}`);
});