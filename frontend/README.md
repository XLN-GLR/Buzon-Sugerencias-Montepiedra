# Buzón de Sugerencias Montepiedra - Frontend

Interfaz web de usuario para el sistema institucional de buzón de sugerencias e incidencias de la Unidad Educativa Montepiedra. Construida con React 18, Vite y Vanilla CSS/CSS Modules, siguiendo las directrices de la **Guía de Ruta: Programación Guiada por IA (Vibe Coding)**.

---

## 🏛️ Características Principales
- **Autenticación por Roles Institucionales:** Soporte para Alumno, Profesor, Mantenimiento, Secretaría y Administrador.
- **Validación de Identidad:** Verificación de cédula ecuatoriana mediante algoritmo Módulo 10 y dominio de correo institucional.
- **Tablero Público Reactivo:** Filtrado por categorías, búsqueda en tiempo real y votación de Likes y Dislikes.
- **Modal Split View:** Inspección detallada de sugerencias y comentarios en una misma vista flotante.
- **Modo Dual y Resiliencia Offline:** Capacidad de operar conectado a la API REST de Express o en modo autónomo con simulador en `localStorage`.
- **Tema Claro / Oscuro:** Selector de tema accesible y persistente.

---

## 📂 Estructura del Proyecto (Adaptada según Guía de Desarrollo)

```
frontend/
├── docs/                      # Documentación de Contexto y Arquitectura (Guía Vibe Coding)
│   ├── PRD.md                 # Documento de Requisitos del Producto y Alcance
│   ├── ARCHITECTURE.md        # Arquitectura del Sistema, Flujo de Datos y Capas
│   ├── DESIGN.md              # Sistema de Diseño, Tokens Visuales y Estados UI
│   ├── TEST_PLAN.md           # Plan y Matriz de Pruebas Funcionales y E2E
│   ├── SECURITY.md            # Checklist de Seguridad y Protección de Datos
│   ├── DECISIONS.md           # Registros de Decisiones de Arquitectura (ADRs)
│   └── MEMORY.md              # Estado Dinámico y Bitácora Viva del Proyecto
├── .cursor/
│   └── rules/                 # Reglas Técnicas Automáticas para el IDE/Agente (.mdc)
├── tests/                     # Directorio de Pruebas Unitarias y E2E
├── public/                    # Archivos estáticos públicos
├── src/                       # Código fuente de la aplicación React
│   ├── assets/                # Logotipos y recursos gráficos
│   ├── components/            # Componentes de presentación (Layout, Header, Sidebar)
│   ├── context/               # Contextos de React (AuthContext, ThemeContext)
│   ├── pages/                 # Vistas de la aplicación (Board, Dashboard, Login, etc.)
│   ├── utils/                 # Cliente HTTP y simulador de fallback local
│   ├── App.jsx                # Enrutador principal y rutas protegidas
│   └── index.css              # Variables CSS y tokens de diseño globales
├── .env.example               # Plantilla de variables de entorno
├── RULES.md                   # Normas técnicas estrictas para desarrolladores/agentes
├── TASKS.md                   # Plan de tareas secuencial y granular
├── package.json               # Dependencias y scripts de ejecución
└── vite.config.js             # Configuración del empaquetador Vite
```

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js (versión 18 LTS o superior)
- Gestor de paquetes npm

### Instalación de Dependencias
```bash
cd frontend
npm install
```

### Ejecución en Modo Desarrollo
```bash
npm run dev
```
La aplicación estará disponible localmente en `http://localhost:5173`.

### Compilación para Producción
```bash
npm run build
```

---

## 📖 Mapa Documental
Para comprender a fondo el diseño, la lógica y los criterios técnicos del frontend, consulta los archivos en `frontend/docs/`:
- [PRD.md](file:///docs/PRD.md): Requisitos de producto y alcance.
- [ARCHITECTURE.md](file:///docs/ARCHITECTURE.md): Diagramas de capas y flujo de datos.
- [DESIGN.md](file:///docs/DESIGN.md): Tokens de diseño, colores y estados visuales.
- [TEST_PLAN.md](file:///docs/TEST_PLAN.md): Casos de prueba y validaciones.
- [SECURITY.md](file:///docs/SECURITY.md): Protocolos de seguridad en cliente.
- [DECISIONS.md](file:///docs/DECISIONS.md): ADRs y justificaciones arquitectónicas.
- [MEMORY.md](file:///docs/MEMORY.md): Bitácora activa del proyecto.
- [RULES.md](file:///RULES.md): Reglas de desarrollo para el agente e ingenieros.
- [TASKS.md](file:///TASKS.md): Lista granular de tareas.
