import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { Config } from './config.js';

const app = express();

// Habilitar CORS para permitir peticiones desde el frontend
app.use(cors());

// Middleware para poder recibir JSON desde el frontend de tu amigo
app.use(express.json());

// Inicializar Supabase
const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ status: "Backend corriendo con Node.js", database: "Conectada a Supabase" });
});

// Listado de palabras prohibidas para moderación de contenido (lenguaje inapropiado)
const FORBIDDEN_WORDS = [
  'mierda', 'puto', 'puta', 'pendejo', 'pendeja', 'cabron', 'cabrón',
  'estupido', 'estúpido', 'tonto', 'tonta', 'idiota', 'imbecil', 'imbécil',
  'groseria', 'grosería', 'basura', 'hijo de puta', 'malparido', 'culiado'
];

// Función para verificar si un texto contiene lenguaje inapropiado
const hasProfanity = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return FORBIDDEN_WORDS.some(word => lower.includes(word));
};

// Ruta para crear una nueva sugerencia
app.post('/sugerencias', async (req, res) => {
  const { titulo, descripcion, categoria, usuario_id, es_anonimo, votos, respuesta_moderador, foto_url } = req.body;

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
    // Inserción en la base de datos
    const { data, error } = await supabase
      .from('sugerencias')
      .insert([
        {
          titulo,
          descripcion,
          categoria,
          usuario_id,
          estado: 'pendiente',
          es_anonimo: es_anonimo ?? false,
          likes: 0,
          dislikes: 0,
          respuesta_moderador: respuesta_moderador ?? null,
          foto_url: foto_url ?? null
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    // Respondemos con status 201 y el objeto creado
    return res.status(201).json({
      message: "Sugerencia creada exitosamente",
      data: data[0]
    });
  } catch (error) {
    console.error("Error al insertar sugerencia en Supabase:", error);
    return res.status(500).json({
      error: "Error interno del servidor al crear la sugerencia",
      details: error.message
    });
  }
});

// Ruta para obtener todas las sugerencias, ordenadas por created_at (más recientes primero)
app.get('/sugerencias', async (req, res) => {
  const userRole = req.headers['x-user-role']; // Rol del usuario actual
  const currentUserId = req.headers['x-user-id'] || req.query.usuario_id; // ID del usuario consultante

  try {
    const { data, error } = await supabase
      .from('sugerencias')
      .select('*, usuarios (id, nombre, correo, foto_url)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Obtener mapa de votos del usuario actual si existe currentUserId
    let userVotesMap = {};
    if (currentUserId) {
      const { data: votosUsuario } = await supabase
        .from('votos_sugerencias')
        .select('sugerencia_id, tipo_voto')
        .eq('usuario_id', String(currentUserId).trim());
      
      if (votosUsuario) {
        votosUsuario.forEach(v => {
          userVotesMap[v.sugerencia_id] = v.tipo_voto;
        });
      }
    }

    // Aplicar regla de privacidad para sugerencias anónimas y estructurar el retorno exacto
    const processedData = data.map(sugerencia => {
      // Manejar la relación usuarios que Supabase puede devolver como objeto o array de un elemento
      let usuarioInfo = sugerencia.usuarios;
      if (Array.isArray(usuarioInfo)) {
        usuarioInfo = usuarioInfo[0] || null;
      }

      // Preparar objeto de usuarios por defecto (datos reales)
      let usuarioFinal = {
        id: usuarioInfo ? usuarioInfo.id : null,
        nombre: usuarioInfo ? usuarioInfo.nombre : "Anónimo",
        correo: usuarioInfo ? usuarioInfo.correo : "anonimo@montepiedra.edu.ec",
        foto_url: usuarioInfo ? usuarioInfo.foto_url : null
      };

      // Si es anónimo y el consultor NO es admin, se anonimiza
      if (sugerencia.es_anonimo) {
        if (userRole !== 'admin') {
          usuarioFinal = {
            id: null,
            nombre: "Anónimo",
            correo: "anonimo@montepiedra.edu.ec",
            foto_url: null
          };
        }
      }

      const calculatedVotos = sugerencia.likes ?? sugerencia.votos ?? 0;

      // Estructura exacta de salida requerida por el contrato (columnas de sugerencia + objeto usuarios)
      return {
        id: sugerencia.id,
        created_at: sugerencia.created_at,
        titulo: sugerencia.titulo,
        descripcion: sugerencia.descripcion,
        categoria: sugerencia.categoria,
        es_anonimo: sugerencia.es_anonimo ?? false,
        votos: calculatedVotos,
        likes: sugerencia.likes ?? 0,
        dislikes: sugerencia.dislikes ?? 0,
        estado: sugerencia.estado || 'pendiente',
        respuesta_moderador: sugerencia.respuesta_moderador || null,
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

// Ruta para registrar / alternar un voto (Likes / Dislikes con Toggle de voto y desmarcado)
app.post('/sugerencias/:id/votar', async (req, res) => {
  const { id } = req.params;
  const { usuario_id, tipo_voto } = req.body;

  // 1. Validación de campos obligatorios
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

  try {
    // 2. Verificar existencia de la sugerencia en Supabase
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

    // 3. Consultar si el usuario ya emitió un voto previo en esta sugerencia
    const { data: votoExistente, error: fetchVotoError } = await supabase
      .from('votos_sugerencias')
      .select('id, tipo_voto')
      .eq('sugerencia_id', id)
      .eq('usuario_id', usuario_id.trim())
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

    // CASO A: TOGGLE OFF (Quitar voto si hace clic en el mismo botón)
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
            usuario_id: usuario_id.trim(),
            tipo_voto: tipo_voto.trim()
          }
        ]);

      if (tipo_voto === 'like') {
        currentLikes = currentLikes + 1;
      } else {
        currentDislikes = currentDislikes + 1;
      }
    }

    // Actualizar contadores en la tabla sugerencias
    const { data: updatedData, error: updateError } = await supabase
      .from('sugerencias')
      .update({ likes: currentLikes, dislikes: currentDislikes, votos: currentLikes })
      .eq('id', id)
      .select('id, likes, dislikes, votos')
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

// Ruta para moderar una sugerencia (cambiar estado y agregar respuesta)
app.patch('/sugerencias/:id/moderacion', async (req, res) => {
  const { id } = req.params;
  const userRole = req.headers['x-user-role']; // Rol del usuario actual
  const { estado, respuesta_moderador } = req.body;

  // 1. Lógica de control de acceso (Seguridad de roles)
  if (userRole !== 'profesor' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. No tienes permisos de moderación."
    });
  }

  try {
    // 2. Consultar existencia del registro en Supabase
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

    // 3. Actualizar estado y respuesta_moderador
    const { data: updatedData, error: updateError } = await supabase
      .from('sugerencias')
      .update({ estado, respuesta_moderador })
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

// =======================================================
// MÓDULO 3: SECRETARÍA (GESTIÓN DE NÓMINAS Y USUARIOS)
// =======================================================

// 1. Ruta para registro masivo de usuarios (Nómina institucional)
app.post('/usuarios/registro-masivo', async (req, res) => {
  const userRole = req.headers['x-user-role'];

  // Validación de permisos de acceso (Secretaría o Admin)
  if (userRole !== 'secretaria' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador."
    });
  }

  const { nomina } = req.body;

  // Validación de estructura de nómina
  if (!nomina || !Array.isArray(nomina) || nomina.length === 0) {
    return res.status(400).json({
      error: "El campo 'nomina' es obligatorio y debe ser un arreglo con al menos un usuario."
    });
  }

  // Validar campos obligatorios de cada usuario en la nómina
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

    // Procesar y encriptar la cédula de cada usuario para su contraseña por defecto
    const usuariosParaInsertar = await Promise.all(
      nomina.map(async (usuario) => {
        const hashedPassword = await bcrypt.hash(String(usuario.cedula).trim(), saltRounds);
        return {
          cedula: String(usuario.cedula).trim(),
          nombre: String(usuario.nombre).trim(),
          correo: String(usuario.correo).trim(),
          rol: usuario.rol ? String(usuario.rol).trim() : 'alumno',
          password: hashedPassword,
          es_primer_ingreso: true,
          foto_url: usuario.foto_url ? String(usuario.foto_url).trim() : null
        };
      })
    );

    // Inserción masiva en Supabase
    const { data: usuariosInsertados, error: insertError } = await supabase
      .from('usuarios')
      .insert(usuariosParaInsertar)
      .select('id, cedula, nombre, correo, rol, es_primer_ingreso');

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
  const userRole = req.headers['x-user-role'];

  // Validación de permisos de acceso (Secretaría o Admin)
  if (userRole !== 'secretaria' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador."
    });
  }

  const { cedula, nombre, correo, rol, foto_url } = req.body;

  // Validación de campos requeridos
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
    // Encriptar la cédula como contraseña por defecto
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(cedula.trim(), saltRounds);

    // Inserción en la base de datos de Supabase
    const { data: nuevoUsuario, error: insertError } = await supabase
      .from('usuarios')
      .insert([
        {
          cedula: cedula.trim(),
          nombre: nombre.trim(),
          correo: correo.trim(),
          rol: rol ? String(rol).trim() : 'alumno',
          password: hashedPassword,
          es_primer_ingreso: true,
          foto_url: foto_url ? String(foto_url).trim() : null
        }
      ])
      .select('id, cedula, nombre, correo, rol, es_primer_ingreso, foto_url')
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
  const userRole = req.headers['x-user-role'];

  // Validación de permisos de acceso (Secretaría o Admin)
  if (userRole !== 'secretaria' && userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador."
    });
  }

  const { rol } = req.query;

  try {
    let query = supabase
      .from('usuarios')
      .select('id, cedula, nombre, correo, rol, foto_url, es_primer_ingreso')
      .order('nombre', { ascending: true });

    if (rol && typeof rol === 'string' && rol.trim()) {
      query = query.eq('rol', rol.trim());
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

// 4. Ruta para eliminar un usuario por su ID
app.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const userRole = req.headers['x-user-role'];

  // Validación de permisos de acceso (Secretaría o Admin)
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

// Ruta para actualizar la foto de perfil de un estudiante o usuario
app.put('/usuarios/:id/foto', async (req, res) => {
  const { id } = req.params;
  const userRole = req.headers['x-user-role'];
  const requesterId = req.headers['x-user-id'];
  const { foto_url } = req.body;

  // Permiso: administración, secretaría o el propio usuario actualizando su foto
  if (userRole !== 'secretaria' && userRole !== 'admin' && userRole !== 'administrador' && String(requesterId) !== String(id)) {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador para cambiar la foto de otro usuario."
    });
  }

  try {
    // 1. Consultar si el usuario existe
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

    // 2. Actualizar foto_url
    const { data: updatedUser, error: updateError } = await supabase
      .from('usuarios')
      .update({ foto_url })
      .eq('id', id)
      .select('id, foto_url')
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      message: "Foto de perfil actualizada exitosamente",
      id: updatedUser.id,
      foto_url: updatedUser.foto_url
    });
  } catch (error) {
    console.error("Error al actualizar foto de perfil en Supabase:", error);
    return res.status(500).json({
      error: "Error interno del servidor al actualizar la foto de perfil",
      details: error.message
    });
  }
});

// Ruta para actualizar la información de un usuario (Nombre, Cédula, Correo, Rol, Foto)
app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const userRole = req.headers['x-user-role'];
  const { nombre, cedula, correo, rol, foto_url } = req.body;

  if (userRole !== 'secretaria' && userRole !== 'admin' && userRole !== 'administrador') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren permisos de secretaría o administrador."
    });
  }

  try {
    const updatePayload = {};
    if (nombre) updatePayload.nombre = String(nombre).trim();
    if (cedula) updatePayload.cedula = String(cedula).trim();
    if (correo) updatePayload.correo = String(correo).trim();
    if (rol) updatePayload.rol = String(rol).trim().toLowerCase();
    if (foto_url !== undefined) updatePayload.foto_url = foto_url;

    const { data: updatedUser, error: updateError } = await supabase
      .from('usuarios')
      .update(updatePayload)
      .eq('id', id)
      .select('id, cedula, nombre, correo, rol, foto_url, es_primer_ingreso')
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

// Ruta para eliminar una sugerencia por su ID (reservado para el rol de administrador)
app.delete('/sugerencias/:id', async (req, res) => {
  const { id } = req.params;
  const userRole = req.headers['x-user-role']; // Simulación temporal de rol hasta implementar Auth

  // Validación de rol administrador
  if (userRole !== 'admin') {
    return res.status(403).json({
      error: "Acceso denegado. Se requieren privilegios de administrador."
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

    // Si data viene vacío, significa que no existía registro con ese ID
    if (!data || data.length === 0) {
      return res.status(404).json({
        error: "No se encontró ninguna sugerencia con el ID proporcionado"
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

// =======================================================
// MÓDULO 1: AUTENTICACIÓN Y PRIMER INGRESO
// =======================================================

// Ruta para inicio de sesión (Login de usuarios)
app.post('/auth/login', async (req, res) => {
  const { cedula, password } = req.body;

  // 1. Validación de campos obligatorios iniciales
  if (!cedula || typeof cedula !== 'string' || !cedula.trim()) {
    return res.status(400).json({
      error: "El campo 'cedula' es obligatorio."
    });
  }

  try {
    // 2. Buscar al usuario por cédula en Supabase
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

    // 3. Validar existencia del usuario
    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado. Verifique la cédula ingresada."
      });
    }

    // 4. Caso Primer Ingreso: retornar requiere_configuracion y datos de usuario
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

    // 5. Caso Ingreso Regular: validar contraseña con hash en BD mediante bcrypt
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({
        error: "El campo 'password' es obligatorio para el inicio de sesión regular."
      });
    }

    if (!usuario.password) {
      return res.status(401).json({
        error: "El usuario no tiene una contraseña configurada en el sistema. Por favor, comuníquese con el administrador."
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

// Ruta para configurar la contraseña en el primer ingreso
app.post('/auth/primer-ingreso', async (req, res) => {
  const { cedula, nueva_password, conservar_cedula } = req.body;

  // 1. Validación de cédula
  if (!cedula || typeof cedula !== 'string' || !cedula.trim()) {
    return res.status(400).json({
      error: "El campo 'cedula' es obligatorio."
    });
  }

  // 2. Validación de contraseña requerida si no se desea conservar la cédula
  const conservarCedulaComoPassword = Boolean(conservar_cedula);
  if (!conservarCedulaComoPassword && (!nueva_password || typeof nueva_password !== 'string' || !nueva_password.trim())) {
    return res.status(400).json({
      error: "Debe proporcionar el campo 'nueva_password' o marcar 'conservar_cedula' como verdadero."
    });
  }

  try {
    // 3. Verificar que el usuario exista en Supabase
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

    // 4. Determinar la contraseña a encriptar y generar el hash con bcrypt (10 rounds)
    const passwordAEncriptar = conservarCedulaComoPassword ? cedula.trim() : nueva_password.trim();
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(passwordAEncriptar, saltRounds);

    // 5. Actualizar la contraseña en Supabase y cambiar es_primer_ingreso a false
    const { data: updatedData, error: updateError } = await supabase
      .from('usuarios')
      .update({
        password: hashedPassword,
        es_primer_ingreso: false
      })
      .eq('id', usuario.id)
      .select('id, cedula, nombre, correo, rol')
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
      usuario: {
        id: updatedData.id,
        cedula: updatedData.cedula,
        nombre: updatedData.nombre,
        correo: updatedData.correo,
        rol: updatedData.rol
      }
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
  const userRole = req.headers['x-user-role'];

  // Validación de permisos de acceso (Mantenimiento o Admin)
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

      return {
        id: sugerencia.id,
        created_at: sugerencia.created_at,
        titulo: sugerencia.titulo,
        descripcion: sugerencia.descripcion,
        categoria: sugerencia.categoria,
        es_anonimo: sugerencia.es_anonimo ?? false,
        votos: sugerencia.votos ?? 0,
        likes: sugerencia.likes ?? 0,
        dislikes: sugerencia.dislikes ?? 0,
        estado: sugerencia.estado,
        respuesta_moderador: sugerencia.respuesta_moderador || null,
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
  const userRole = req.headers['x-user-role'];
  const { estado } = req.body;

  // Validación de permisos de acceso (Mantenimiento o Admin)
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

// 3. Ruta para crear una nueva tarea de mantenimiento
app.post('/mantenimiento/tareas', async (req, res) => {
  const userRole = req.headers['x-user-role'];

  // Validación de permisos de acceso (Mantenimiento o Admin)
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
          creado_por: creado_por.trim()
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

// 4. Ruta para eliminar una tarea de mantenimiento por su ID
app.delete('/mantenimiento/tareas/:id', async (req, res) => {
  const { id } = req.params;
  const userRole = req.headers['x-user-role'];

  // Validación de permisos de acceso (Mantenimiento o Admin)
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

// Iniciar servidor en el puerto local
app.listen(Config.PORT, Config.HOST, () => {
  console.log(`Servidor backend listo en http://${Config.HOST}:${Config.PORT}`);
});