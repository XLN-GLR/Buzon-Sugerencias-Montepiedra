# DESIGN: Sistema de Diseño y Reglas Visuales

## 1. Identidad Gráfica y Paleta de Colores
El sistema de diseño del Buzón de Sugerencias Montepiedra está construido sobre los colores emblemáticos de la institución educativa, proporcionando armonía y legibilidad en temas Claro y Oscuro.

### Variables CSS Principales (`src/index.css`):
| Token CSS | Valor (Modo Claro) | Valor (Modo Oscuro) | Uso |
|---|---|---|---|
| `--color-primary` | `#006C3D` (Verde Montepiedra) | `#006C3D` | Acciones principales, botones primarios, enlaces activos |
| `--color-primary-hover` | `#00542F` | `#004828` | Estado hover de acciones primarias |
| `--color-primary-light` | `#E6F3EC` | `#00361E` | Fondos de selección, badges primarios |
| `--color-secondary` | `#838281` (Gris Institucional) | `#838281` | Botones secundarios, bordes neutros |
| `--color-secondary-hover`| `#6B6A69` | `#595857` | Hover secundario |
| `--color-secondary-light`| `#F1F2F4` | `#262626` | Fondos de contenedor secundarios |
| `--color-bg` | `#F8F9FA` | `#121212` | Fondo general de la aplicación |
| `--color-card-bg` | `#FFFFFF` | `#1E1E1E` | Fondo de tarjetas, modales y paneles |
| `--color-text` | `#1F2937` | `#F3F4F6` | Texto principal de alta legibilidad |
| `--color-text-muted` | `#6B7280` | `#9CA3AF` | Textos secundarios, metadatos y fechas |
| `--color-border` | `#E5E7EB` | `#374151` | Líneas divisorias y contornos de inputs |

### Colores de Estado Semántico:
- **Éxito (Aprobada / Realizada):** `--color-success` (`#10B981`) / Fondo: `--color-success-bg` (`#D1FAE5` claro / `#064E3B` oscuro).
- **Alerta / En Proceso:** `--color-warning` (`#F59E0B`) / Fondo: `--color-warning-bg` (`#FEF3C7` claro / `#78350F` oscuro).
- **Peligro / Rechazada / Destructivo:** `--color-danger` (`#EF4444`) / Fondo: `--color-danger-bg` (`#FEE2E2` claro / `#7F1D1D` oscuro).

---

## 2. Tipografía y Jerarquía
- **Familia Tipográfica para Títulos:** `'Outfit', system-ui, -apple-system, sans-serif`
  - Utilizada en `h1`, `h2`, `h3`, `h4`, títulos de tarjetas y encabezados de navegación.
  - Pesos: `600` (Semi-bold), `700` (Bold), `800` (Extra-bold).
- **Familia Tipográfica para Cuerpo y Lectura:** `'Inter', system-ui, -apple-system, sans-serif`
  - Utilizada en párrafos, etiquetas de formulario, botones y datos tabulares.
  - Pesos: `400` (Regular), `500` (Medium), `600` (Semi-bold).

---

## 3. Tokens de Geometría y Elevación (Bordes y Sombras)
- **Border Radius:**
  - `--radius-sm`: `0.375rem` (6px) - Badges, botones pequeños.
  - `--radius-md`: `0.5rem` (8px) - Inputs, botones estándar, controles.
  - `--radius-lg`: `1rem` (16px) - Tarjetas, paneles modales, cajas principales.
  - `--radius-xl`: `1.5rem` (24px) - Contenedores exteriores y ventanas modales split.
- **Sombras (Box Shadows):**
  - `--shadow-sm`: Elevación tenue para elementos en reposo.
  - `--shadow-md`: Elevación media para tarjetas interactivas.
  - `--shadow-lg`: Elevación pronunciada para menús flotantes, modales y popovers.
- **Transiciones:**
  - `--transition-fast`: `0.15s ease`
  - `--transition-normal`: `0.25s cubic-bezier(0.4, 0, 0.2, 1)`

---

## 4. Componentes Base de Interfaz

### Botones (`.btn`):
1. **Botón Primario (`.btn-primary`):** Fondo verde institucional (`#006C3D`), texto blanco, esquinas redondeadas, sombra suave.
2. **Botón Secundario (`.btn-secondary`):** Contorno gris o fondo claro suave (`--color-secondary-light`), texto oscuro/claro adaptable.
3. **Botón Peligro / Destructivo (`.btn-danger`):** Fondo rojo semántico (`#EF4444`), reservado para rechazar propuestas, eliminar registros o cerrar sesión.

### Tarjetas de Sugerencia (`.card`):
- Contenedor con borde tenue (`--color-border`), fondo `--color-card-bg`, y radio `--radius-lg`.
- Cabecera con categoría, etiqueta de rol/autor o badge "Anónimo", y fecha formateada.
- Cuerpo descriptivo con soporte para vista previa de imagen en miniatura.
- Barra inferior con contadores reactivos de votos (Likes/Dislikes) y botón para desplegar el modal split de comentarios.

---

## 5. Estados Obligatorios de la Interfaz (Guía de Calidad UI)
1. **Estado de Carga (Loading State):**
   - Utilizar esqueletos animados (Skeletons) o indicadores circulares (`spinner`) durante la carga de peticiones asíncronas para evitar saltos de maquetación (CLS).
2. **Estado de Error (Error State):**
   - Banners visuales de error con contraste adecuado, ícono descriptivo y opción de reintento.
3. **Estado Vacío (Empty State):**
   - Si no hay sugerencias en una categoría o la búsqueda no arroja resultados, mostrar un componente amigable con ilustración/icono institucional y mensaje orientativo (e.g. *"No hay sugerencias en esta categoría. ¡Sé el primero en aportar una idea!"*).
4. **Estado Adaptativo (Responsive):**
   - Disposición fluida con Mobile-First:
     - En pantallas móviles (< 768px): Navegación colapsable o barra inferior, cuadrículas de 1 columna.
     - En tabletas y pantallas grandes (>= 1024px): Sidebar persistente, cuadrícula de 2 o 3 columnas, y modales de tipo Split View (dos columnas lado a lado).
