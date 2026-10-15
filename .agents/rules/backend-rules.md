# Reglas Técnicas del Backend - Buzón de Sugerencias Montepiedra

Estas reglas son de cumplimiento obligatorio para cualquier intervención del Agente de IA o desarrollador en el backend de este proyecto:

## 1. Alcance y Restricciones
- **Exclusividad de Backend:** Solo realizar cambios dentro del directorio `backend/`. Bajo ninguna circunstancia alterar, renombrar, mover o eliminar archivos dentro de `frontend/`.
- **Integridad de Código Existente:** No alterar la lógica de negocio, controladores, contratos ni middlewares existentes salvo que sea explícitamente solicitado por el usuario en una tarea acotada.

## 2. Calidad de Código y Estilo
- **JavaScript Moderno:** Usar ECMAScript Modules (`import/export`), sintaxis asíncrona moderna (`async/await`) y manejo de errores consistente con bloques `try/catch`.
- **Contratos de Respuesta HTTP:** 
  - Toda respuesta de error debe devolver un código de estado semántico apropiado (400, 401, 403, 404, 500) y un JSON `{ "error": "...", "details": "..." }`.
  - Las respuestas exitosas deben coincidir con la especificación de `CONTRATO_DATOS.md`.
- **Validaciones en Servidor:**
  - Toda cédula recibida debe validarse obligatoriamente mediante el algoritmo matemático de Módulo 10.
  - Las sugerencias deben ser filtradas contra la lista de moderación léxica de palabras ofensivas antes de su persistencia.

## 3. Seguridad y Privacidad
- **Cero Exposición de Secretos:** Nunca escribir credenciales de base de datos (`SUPABASE_KEY`, `SUPABASE_URL`), contraseñas o tokens directamente en el código. Toda configuración confidencial debe extraerse desde `process.env`.
- **Cifrado de Contraseñas:** Emplear siempre `bcrypt` con un factor de costo mínimo de 10 salt rounds antes de guardar contraseñas en PostgreSQL.
- **Protección de Identidad:** Anonimizar datos de usuario (`usuarios = null`) cuando `es_anonimo` sea `true` y el solicitante no cuente con rol `admin`.

## 4. Flujo de Trabajo (Vibe Coding Guide)
- Respetar el ciclo de 9 pasos: LEER -> ENTENDER -> PLANIFICAR -> IMPLEMENTAR -> PROBAR -> REVISAR -> CORREGIR -> CONFIRMAR (COMMIT) -> ACTUALIZAR DOCUMENTACIÓN.
- Siempre desarrollar en **Rebanadas Verticales** (Vertical Slices): no intentar reescribir capas completas sin validar de extremo a extremo.
