# PRD: Buzón de Sugerencias Montepiedra (Frontend)

## 1. Visión General del Producto
El **Buzón de Sugerencias Montepiedra** es una plataforma web institucional diseñada para canalizar, organizar y dar seguimiento transparente a las propuestas, solicitudes e incidencias formuladas por la comunidad de la Unidad Educativa Montepiedra (alumnos, docentes, personal administrativo y de mantenimiento).

El frontend proporciona una interfaz moderna, interactiva y accesible, con soporte para modo claro y oscuro, control de acceso basado en roles y capacidad de operación en modo en línea (conectado a API REST) o modo fuera de línea resiliente (simulación local).

---

## 2. Definición de Usuarios Objetivo (Personas)
1. **Alumno:**
   - Envía sugerencias sobre infraestructura, actividades académicas o extracurriculares.
   - Puede votar (Like / Dislike) en las propuestas de sus compañeros y comentar constructivamente.
   - Opción de emitir sugerencias de forma anónima para resguardar su privacidad.
2. **Profesor:**
   - Visualiza propuestas y participa en debates constructivos.
   - Accede a paneles de revisión y moderación orientativa.
3. **Personal de Mantenimiento:**
   - Accede al tablón especializado de tareas técnicas (`/mantenimiento`) clasificadas por estado (Pendiente, En Proceso, Realizada).
4. **Secretaría:**
   - Gestiona el padrón y nómina institucional de usuarios (`/secretaria`), verificando credenciales, estados de cuenta y cédulas válidas.
5. **Administrador:**
   - Control total de la plataforma (`/admin` y `/secretaria`), facultado para moderar sugerencias, emitir respuestas oficiales, cambiar estados y gestionar usuarios.

---

## 3. Problema que Resuelve
- **Falta de trazabilidad:** Históricamente las inquietudes estudiantiles se perdían en buzones físicos o correos dispersos.
- **Opacidad:** Los usuarios no conocían si su sugerencia fue revisada, asignada o descartada.
- **Falta de priorización democrática:** No existía una métrica objetiva para determinar cuáles inquietudes afectan a un mayor número de estudiantes.

---

## 4. Resultado Principal y Propuesta de Valor
Centralizar la comunicación institucional en un único panel reactivo donde cada sugerencia cuente con un ciclo de vida transparente:
`Pendiente` → `En Proceso` / `Aprobada` → `Realizada` (o `Rechazada`).

---

## 5. Alcance del MVP (Frontend)
- **Autenticación Institucional:**
  - Login validado por cédula (con validación de algoritmo Módulo 10) y correo institucional.
  - Gestión de sesión y perfiles precargados con primer inicio de sesión asistido.
- **Tablero Público de Sugerencias (`/`):**
  - Listado de tarjetas de sugerencias con filtrado por categoría (`Infraestructura`, `Academico`, `Eventos`, `Limpieza`, etc.).
  - Búsqueda en tiempo real por título o contenido.
  - Ordenamiento por más votadas, más recientes o por estado.
  - Sistema de votos bidireccional (Likes / Dislikes) reactivo.
  - Modal Split interactivo de detalles con hilo de comentarios.
- **Creación de Sugerencias (`/nueva-sugerencia`):**
  - Formulario con título, descripción, categoría, opción de anonimato y carga de evidencia fotográfica (URL).
  - Validación de campos obligatorios y advertencia de moderación léxica.
- **Paneles Especializados por Rol:**
  - Panel de Mantenimiento (`/mantenimiento`): vista kanban/tabla de incidencias físicas.
  - Panel de Secretaría (`/secretaria`): tabla de nómina con filtro de cédulas y cursos.
  - Panel de Moderación / Dashboard Administrativo (`/admin`): aprobación, rechazo y respuesta oficial del moderador.
- **Perfil de Usuario (`/perfil`):**
  - Resumen de actividad personal, sugerencias enviadas y configuración de contraseña.
- **Diseño y Accesibilidad:**
  - Selector de tema (Claro / Oscuro) persistente.
  - Sistema de diseño fiel a la identidad visual de Montepiedra.

---

## 6. Fuera de Alcance (Out of Scope para la versión actual)
- Pagos o donaciones estudiantiles en línea.
- Mensajería privada o chat directo entre estudiantes.
- Aplicación móvil nativa (Android/iOS) empaquetada; se prioriza diseño Web Responsive adaptable a móviles.
- Integración con sistemas ERP externos no contemplados en el contrato de API.
