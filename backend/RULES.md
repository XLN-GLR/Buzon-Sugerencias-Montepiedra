# RULES: Reglas de Desarrollo para el Backend (Buzón Montepiedra)

Este documento define las directrices y normas de ingeniería que todo agente de IA y desarrollador debe acatar estrictamente al trabajar en el backend del Buzón de Sugerencias Montepiedra.

---

## 1. Reglas Inviolables
1. **Alcance Confinado al Backend:** Toda modificación o adición debe realizarse exclusivamente dentro del directorio `backend/`. El directorio `frontend/` y sus archivos están **estrictamente prohibidos de ser tocados, modificados o movidos**.
2. **Preservación Estricta de Código Existente:** Salvo instrucción explícita del usuario para una funcionalidad específica, no se debe alterar la lógica funcional, firmas de métodos ni el comportamiento en producción del código existente (`backend/index.js`, `backend/config.js`, etc.).
3. **Cero Fuga de Credenciales:** Nunca escribir de forma fija (hardcodeada) claves de Supabase, cadenas de conexión de base de datos ni contraseñas en archivos de código o en el repositorio. Toda variable confidencial debe cargarse mediante `process.env`.
4. **Respeto a los Contratos de API:** Cualquier cambio en rutas, parámetros de consulta o payloads JSON debe mantener compatibilidad hacia atrás con el contrato documentado en `backend/CONTRATO_DATOS.md` y consumido por el frontend.

---

## 2. Reglas de Calidad y Estilo de Código
1. **ECMAScript Modules Modernos:** Utilizar sintaxis nativa de ES Modules (`import/export`). No mezclar con `require()` de CommonJS.
2. **Manejo Centralizado de Errores:**
   - Todos los manejadores asíncronos deben emplear bloques `try/catch`.
   - No exponer trazas de pila (stack traces) internas o volcados de memoria al cliente HTTP en peticiones fallidas.
   - Responder siempre con un objeto JSON uniforme: `{ "error": "Mensaje legible", "details": "..." }`.
3. **Validación de Datos en Servidor:**
   - Nunca confiar en las validaciones exclusivas del cliente.
   - Toda cédula recibida debe verificarse mediante el algoritmo de Módulo 10 antes de consultar o insertar en la base de datos.
   - Todo texto libre susceptible de publicación pública debe pasar por el filtro léxico `hasProfanity()`.
4. **Seguridad Criptográfica:**
   - Toda contraseña de usuario debe procesarse con `bcrypt.hash()` utilizando un factor de costo no menor a 10 rondas antes de persistirse.

---

## 3. Protocolo de Trabajo del Agente (Vibe Coding)
Cada intervención técnica en el backend debe apegarse al flujo de 9 pasos:
1. **LEER:** Consultar `backend/docs/` y el archivo de tareas `backend/TASKS.md`.
2. **ENTENDER:** Verificar el alcance delimitado del requerimiento.
3. **PLANIFICAR:** Desglosar la secuencia lógica sin tocar código prematuramente.
4. **IMPLEMENTAR:** Escribir código limpio, modular y autocontenido.
5. **PROBAR:** Verificar las respuestas HTTP mediante `backend/pruebas.http`.
6. **REVISAR:** Cotejar contra `backend/docs/SECURITY.md` y `backend/docs/DESIGN.md`.
7. **CORREGIR:** Subsanar cualquier incongruencia detectada.
8. **CONFIRMAR (COMMIT):** Registrar los cambios en Git con mensajes claros y descriptivos.
9. **ACTUALIZAR DOCUMENTACIÓN:** Marcar tareas en `backend/TASKS.md` y registrar novedades en `backend/docs/MEMORY.md`.
