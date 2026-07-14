import express from 'express';
import cors from 'cors';
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

// Ruta para crear una nueva sugerencia
app.post('/sugerencias', async (req, res) => {
  const { titulo, descripcion, categoria, usuario_id } = req.body;

  // Validación de campos requeridos
  if (!titulo || !descripcion || !categoria || !usuario_id) {
    return res.status(400).json({
      error: "Faltan campos obligatorios. Debes proporcionar: titulo, descripcion, categoria y usuario_id."
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
          estado: 'pendiente' // valor por defecto explícito o implícito
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

  try {
    const { data, error } = await supabase
      .from('sugerencias')
      .select('*, usuarios (id, nombre, correo, foto_url)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Aplicar regla de privacidad para sugerencias anónimas
    const processedData = data.map(sugerencia => {
      const copy = { ...sugerencia };
      
      // Manejar la relación usuarios que Supabase puede devolver como objeto o array de un elemento
      let usuarioInfo = copy.usuarios;
      if (Array.isArray(usuarioInfo)) {
        usuarioInfo = usuarioInfo[0] || null;
      }

      if (copy.es_anonimo) {
        if (userRole === 'admin') {
          // Admin ve datos reales
          copy.usuarios = usuarioInfo;
        } else {
          // Profesor o alumno (o rol no especificado/inválido) ven datos anonimizados
          copy.usuarios = {
            id: null,
            nombre: "Anónimo",
            correo: "anonimo@montepiedra.edu.ec",
            foto_url: null
          };
        }
      } else {
        // No es anónimo, se envían siempre los datos reales
        copy.usuarios = usuarioInfo;
      }

      return copy;
    });

    return res.status(200).json({
      message: "Sugerencias recuperadas exitosamente",
      data: processedData
    });
  } catch (error) {
    console.error("Error al obtener sugerencias de Supabase:", error);
    return res.status(500).json({
      error: "Error interno del servidor al crear la sugerencia",
      details: error.message
    });
  }
});

// Ruta para eliminar una sugerencia por su ID (reservado para el rol de administrador)
app.delete('/sugerencias/:id', async (req, res) => {
  const { id } = req.params;
  const userRole = req.headers['x-user-role']; // Simulación temporal de rol hasta implementar Auth

  // Validación de rol administrador
  if (userRole !== 'administrador') {
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

// Iniciar servidor en el puerto local
app.listen(Config.PORT, Config.HOST, () => {
  console.log(`Servidor backend listo en http://${Config.HOST}:${Config.PORT}`);
});