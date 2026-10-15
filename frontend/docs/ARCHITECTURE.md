# ARCHITECTURE: Arquitectura del Frontend (Buzón de Sugerencias Montepiedra)

## 1. Stack Tecnológico del Frontend
- **Framework Principal:** React 18 (SPA - Single Page Application)
- **Empaquetador y Entorno de Ejecución:** Vite 5 (ESBuild + Rollup)
- **Enrutamiento:** React Router DOM v7
- **Gestión de Estado:** React Context API (`AuthContext`, `ThemeContext`) y estado local reactivo (`useState`, `useReducer`, `useEffect`)
- **Estilos:** Vanilla CSS moderno con variables/tokens globales (`src/index.css`) y CSS Modules (`*.module.css`) para componentes aislados
- **Tipografía:** Google Fonts (`Outfit` para encabezados y acentos, `Inter` para texto corrido)
- **Cliente HTTP / Capa de Persistencia:** Módulo cliente personalizado (`src/utils/api.js`) con soporte de doble modo (API REST + Simulador Offline LocalStorage)

---

## 2. Separación de Capas y Flujo de Datos

```
+--------------------------------------------------------------+
|                    CAPA DE PRESENTACIÓN                      |
|  - Páginas (src/pages/): Board, Dashboard, Login, etc.       |
|  - Componentes (src/components/): Header, Sidebar, Layout    |
+------------------------------+-------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                   CAPA DE ESTADO Y CONTEXTO                  |
|  - AuthContext: Autenticación, sesión, perfil y cédula M10   |
|  - ThemeContext: Alternancia de tema (Claro / Oscuro)        |
+------------------------------+-------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|             CAPA DE SERVICIOS Y ABSTRACCIÓN API              |
|  - src/utils/api.js:                                         |
|      * HTTP Client hacia backend (http://127.0.0.1:8080)     |
|      * Fallback Automático Offline (LocalStorage + Seeds)    |
|      * Adaptador de Contrato de Datos (10 Columnas)          |
+------------------------------+-------------------------------+
                               | (HTTP / JSON)
                               v
+--------------------------------------------------------------+
|                      BACKEND REST API                        |
|   (Proceso Node/Express independiente en puerto 8080)        |
+--------------------------------------------------------------+
```

### Reglas de Separación de Responsabilidades:
1. **La UI no interactúa directamente con la base de datos:** Cualquier solicitud de datos pasa por `src/utils/api.js` o por los contextos globales.
2. **Componentes Puros de Presentación:** Los componentes ubicados en `src/components/` se centran en la estructura visual y navegación, delegando la lógica de negocio a páginas y contextos.
3. **Control de Acceso Declarativo:** El enrutamiento en `App.jsx` encapsula las páginas con guards (`ProtectedRoute`, `RoleRoute`, `GuestRoute`), impidiendo accesos no autorizados antes de renderizar la vista.

---

## 3. Estructura de Carpetas del Frontend

```
frontend/
├── docs/                      # Documentación de contexto y arquitectura (Guía Vibe Coding)
│   ├── PRD.md                 # Documento de requisitos del producto
│   ├── ARCHITECTURE.md        # Arquitectura del frontend y flujo de datos
│   ├── DESIGN.md              # Sistema de diseño, paleta, componentes y estados UI
│   ├── TEST_PLAN.md           # Plan de pruebas, casos y criterios de aceptación
│   ├── SECURITY.md            # Políticas de seguridad en el cliente
│   ├── DECISIONS.md           # Registros de decisiones de arquitectura (ADRs)
│   └── MEMORY.md              # Estado dinámico de progreso, tareas y notas vivas
├── .cursor/
│   └── rules/                 # Reglas técnicas automáticas para el IDE/Agente
├── tests/                     # Directorio de pruebas unitarias, integración y E2E
├── public/                    # Recursos estáticos servidos sin procesar (favicons, svgs)
├── src/                       # Código fuente de la aplicación
│   ├── assets/                # Imágenes institucionales, logotipos y gráficos
│   ├── components/            # Componentes reutilizables de UI y estructura (Layout, Header, Sidebar)
│   ├── context/               # Proveedores de contexto global (AuthContext, ThemeContext)
│   ├── pages/                 # Vistas o pantallas enrutadas (Board, Login, Dashboard, etc.)
│   ├── utils/                 # Utilidades, cliente HTTP y simulador local de API
│   ├── App.css                # Estilos específicos del contenedor raíz de la aplicación
│   ├── App.jsx                # Configuración de enrutador y rutas protegidas
│   ├── index.css              # Tokens de diseño, variables CSS y estilos globales
│   └── main.jsx               # Punto de entrada y montaje de React en el DOM
├── .env.example               # Plantilla de variables de entorno requeridas
├── .gitignore                 # Exclusiones de Git para el frontend
├── eslint.config.js           # Configuración de linter (ESLint)
├── index.html                 # Plantilla HTML base para Vite
├── package.json               # Manifiesto de dependencias y scripts de Node
├── README.md                  # Documentación general orientada a desarrolladores
├── RULES.md                   # Normas estrictas para el agente de IA y programadores
├── TASKS.md                   # Plan granular de tareas por fases
└── vite.config.js             # Configuración del bundler Vite
```

---

## 4. Estrategia de Resiliencia y Modo Dual
Para facilitar el desarrollo desacoplado y permitir pruebas sin requerir conexión permanente a una base de datos de producción:
- El cliente `src/utils/api.js` detecta automáticamente si el servidor backend responde en `http://127.0.0.1:8080`.
- Si el backend no está disponible o falla la conexión, la aplicación recurre a un **Simulador Local en LocalStorage** inicializado con datos semilla institucionales (`SEED_SUGGESTIONS`, `SEED_COMMENTS`, `SEED_NOMINA`).
- Esta estrategia de fallback garantiza una experiencia continua de usuario y minimiza fricciones durante el testing de interfaz.
