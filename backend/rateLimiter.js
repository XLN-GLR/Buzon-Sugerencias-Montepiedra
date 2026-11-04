import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Determina si el usuario que realiza la petición está exento de limitación de tasa.
 * La limitación aplica únicamente a los estudiantes ('alumno').
 * Docentes, profesores, administradores, secretaría, mantenimiento y cualquier rol directivo quedan exentos.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
export const isExemptRole = (req) => {
  //return true;// saltar el limitador para hacer pruebas
  const rawRole =
    req.headers?.['x-user-role'] ||
    req.body?.userRole ||
    req.body?.rol ||
    req.user?.rol ||
    req.user?.role;

  if (!rawRole || rawRole === 'undefined' || rawRole === 'null') {
    // Si no se especifica rol, se considera 'alumno' por defecto (aplica el límite)
    return false;
  }

  const role = String(rawRole).trim().toLowerCase();
  // Cualquier rol distinto de 'alumno' queda exento de las restricciones
  return role !== 'alumno';
};

/**
 * Generador de claves para entornos de red institucional compartida (NAT).
 * Prioriza el ID de usuario desde el cuerpo de la petición, encabezados o token/sesión.
 * Recurre a la dirección IP solo si no existe ningún identificador de usuario disponible.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
export const customKeyGenerator = (req) => {
  const rawUserId =
    req.body?.usuario_id ||
    req.headers?.['x-user-id'] ||
    req.user?.id ||
    req.user?.usuario_id ||
    req.query?.usuario_id;

  if (rawUserId && rawUserId !== 'undefined' && rawUserId !== 'null') {
    const trimmed = String(rawUserId).trim();
    if (trimmed.length > 0) {
      return `user:${trimmed}`;
    }
  }

  const clientIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  return ipKeyGenerator(clientIp);
};

/**
 * Limitador para creación de sugerencias:
 * - Ventana: 24 horas continuas (24 * 60 * 60 * 1000 ms)
 * - Cupo: 1 publicación exitosa por ventana para alumnos
 * - Omite peticiones fallidas (HTTP 4xx / 5xx) para no descontar saldo ante rechazos de moderación o errores
 */
export const suggestionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  skip: isExemptRole,
  keyGenerator: customKeyGenerator,
  skipFailedRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: "Has alcanzado el límite de 1 sugerencia cada 24 horas. Por favor, intenta de nuevo más tarde."
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  }
});

/**
 * Limitador para creación de comentarios:
 * - Ventana: 1 hora continua (60 * 60 * 1000 ms)
 * - Cupo: 5 publicaciones exitosas por ventana para alumnos
 * - Omite peticiones fallidas (HTTP 4xx / 5xx) para no descontar saldo ante rechazos de moderación o errores
 */
export const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip: isExemptRole,
  keyGenerator: customKeyGenerator,
  skipFailedRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: "Has alcanzado el límite de 5 comentarios por hora. Por favor, espera antes de publicar nuevos comentarios."
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  }
});

export default {
  suggestionLimiter,
  commentLimiter,
  customKeyGenerator,
  isExemptRole
};
