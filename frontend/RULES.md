# RULES: Reglas de Desarrollo para el Frontend (Buzón Montepiedra)

Este documento define las reglas de conducta y buenas prácticas de ingeniería que todo agente de IA y desarrollador debe seguir estrictamente al interactuar con el código frontend.

---

## 1. Reglas Inviolables
1. **Alcance Confinado:** El desarrollador o agente debe intervenir **únicamente** en la carpeta `frontend/`. El backend (`backend/`) está estrictamente fuera de los límites de cualquier tarea de frontend.
2. **Preservación de Código y Estructura:** No refactorizar ni modificar archivos existentes de forma masiva o no solicitada. Cualquier cambio debe ser mínimo, justificado y estrictamente acotado a la tarea asignada.
3. **Cero Fuga de Secretos:** No subir jamás credenciales, llaves de API con privilegios de escritura/servicio ni tokens de acceso a repositorios públicos o bundles de cliente.

---

## 2. Reglas de Arquitectura y Código
1. **Separación de Capas:**
   - La capa de presentación (`src/pages/`, `src/components/`) debe utilizar `src/utils/api.js` o contextos de React; nunca interactuar directamente con servicios de datos ni manipular sockets/conexiones de base de datos directamente desde la vista.
2. **Reutilización de Componentes:**
   - Si un componente visual (como botones, badges, modales, alertas o tarjetas) ya existe, reutilizarlo en lugar de duplicar código HTML o crear clases CSS redundantes.
3. **Consistencia con el Design System:**
   - Utilizar las variables declaradas en `src/index.css`.
   - Garantizar compatibilidad con temas Claro y Oscuro en cualquier interfaz nueva.
4. **Validación de Datos:**
   - Toda interacción con identificación ecuatoriana debe pasar por la validación del algoritmo Módulo 10.
   - Todo formulario debe proveer mensajes claros de error y estados de carga (`disabled` durante envíos).

---

## 3. Protocolo de Trabajo por Tareas
Cada intervención debe seguir la estructura estándar de prompt establecida en la guía:
- `[CONTEXTO]`
- `[TAREA]`
- `[ARCHIVOS AFECTADOS]`
- `[RESTRICCIONES]`
- `[CRITERIOS DE ACEPTACIÓN]`
- `[PRUEBAS Y VALIDACIÓN]`

Al finalizar cada tarea, actualizar siempre `docs/MEMORY.md` y `TASKS.md` marcando el progreso alcanzado.
