# ARCHITECTURE: Arquitectura del Backend (Buzón de Sugerencias Montepiedra)

## 1. Stack Tecnológico del Backend
- **Entorno de Ejecución:** Node.js (LTS v18+ / v20+)
- **Sistema de Módulos:** ECMAScript Modules (`"type": "module"`)
- **Framework Web:** Express.js v4.19.2
- **CORS:** Cross-Origin Resource Sharing habilitado mediante middleware `cors`
- **Persistencia & BaaS:** Supabase Client (`@supabase/supabase-js` v2.43.0) conectado a base de datos PostgreSQL en la nube
- **Criptografía:** `bcrypt` v6.0.0 para hashing seguro de contraseñas (salt factor: 10)
- **Gestión de Configuración:** `dotenv` v16.4.5 cargando variables desde `.env`
- **Protocolo de Comunicación:** API RESTful sobre HTTP/1.1 con payloads y respuestas en formato JSON

---

## 2. Diagrama de Capas y Flujo de Datos

```
+-------------------------------------------------------------------------+
|                  CLIENTE EXTERNO (FRONTEND / HTTP CLIENT)               |
|            React SPA en http://localhost:5173 o pruebas.http            |
+------------------------------------+------------------------------------+
                                     |
                                     | Peticiones HTTP (JSON / REST)
                                     v
+-------------------------------------------------------------------------+
|                       CAPA DE ENTRADA Y MIDDLEWARES                     |
|  - CORS (permite solicitudes desde el frontend Vite)                   |
|  - express.json() (Parseo de payloads JSON entrantes)                   |
|  - Normalización de Roles (Header 'x-user-role')                       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                 CAPA DE VALIDACIÓN Y REGLAS DE NEGOCIO                  |
|  - Algoritmo Módulo 10 (Cédula de identidad ecuatoriana)                |
|  - Filtro de Moderación Léxica (Detección de palabras prohibidas)       |
|  - Control de Unicidad de Voto (Like / Dislike)                         |
|  - Anonimización Dinámica (Ocultamiento de 'usuarios' para no-admin)    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                    CAPA DE CONTROLADORES Y ENRUTAMIENTO                 |
|  - Módulo 1: /auth (Login, Primer Ingreso)                              |
|  - Módulo 2: /sugerencias (CRUD, Votación, Comentarios, Moderación)     |
|  - Módulo 3: /usuarios (Nómina, Registro Masivo, Perfiles)              |
|  - Módulo 4: /mantenimiento (Tareas técnicas e incidencias físicas)     |
+------------------------------------+------------------------------------+
                                     |
                                     | SDK Supabase JS Client
                                     v
+-------------------------------------------------------------------------+
|                CAPA DE PERSISTENCIA (SUPABASE / POSTGRESQL)             |
|  - Tablas: usuarios, sugerencias, votos_sugerencias,                     |
|    comentarios_sugerencias, tareas_mantenimiento                        |
|  - Integridad Referencial (Foreign Keys con ON DELETE SET NULL/CASCADE) |
|  - Políticas de Seguridad de Nivel de Fila (RLS)                        |
+-------------------------------------------------------------------------+
```

---

## 3. Estructura de Directorios del Backend

```
backend/
├── docs/                      # Documentación arquitectónica y de contexto (Guía Vibe Coding)
│   ├── PRD.md                 # Documento de requisitos del producto backend
│   ├── ARCHITECTURE.md        # Arquitectura técnica, capas y flujo de datos
│   ├── DESIGN.md              # Diseño de API REST, contratos y códigos HTTP
│   ├── TEST_PLAN.md           # Plan de pruebas, casos y verificación con pruebas.http
│   ├── SECURITY.md            # Políticas de seguridad, validación M10 y hashing
│   ├── DECISIONS.md           # Registros de decisiones de arquitectura (ADRs)
│   └── MEMORY.md              # Estado dinámico de progreso, endpoints y notas vivas
├── tests/                     # Suite y documentación de pruebas de endpoints
│   └── README.md              # Guía de ejecución de pruebas automatizadas y manuales
├── .env.example               # Plantilla de variables de entorno requeridas
├── .gitignore                 # Exclusiones de Git para el backend (node_modules, .env)
├── config.js                  # Centralización y validación de variables de entorno
├── CONTRATO_DATOS.md          # Especificación formal de contratos de payload y respuesta
├── index.js                   # Servidor Express monolítico y controladores de ruta
├── package.json               # Dependencias del backend y scripts de ejecución
├── package-lock.json          # Árbol de versiones bloqueadas de dependencias
└── pruebas.http               # Colección de peticiones HTTP para REST Client / Thunder Client
```

---

## 4. Módulos y Rutas Principales

| Módulo | Método | Endpoint | Descripción | Encabezados Requeridos |
| :--- | :--- | :--- | :--- | :--- |
| **Estado** | `GET` | `/` | Comprobación de salud y conexión | - |
| **Auth** | `POST` | `/auth/login` | Inicio de sesión con cédula y contraseña | `Content-Type: application/json` |
| **Auth** | `POST` | `/auth/primer-ingreso` | Activación de cuenta y asignación de password | `Content-Type: application/json` |
| **Sugerencias** | `POST` | `/sugerencias` | Creación de propuesta con filtro léxico | `Content-Type: application/json` |
| **Sugerencias** | `GET` | `/sugerencias` | Listado general ordenado (con anonimización) | `x-user-role` |
| **Sugerencias** | `POST` | `/sugerencias/:id/votar` | Registro atómico de voto (`like`/`dislike`) | `Content-Type: application/json` |
| **Sugerencias** | `PATCH`| `/sugerencias/:id/moderacion` | Aprobación/rechazo y respuesta oficial | `x-user-role: admin` |
| **Sugerencias** | `DELETE`| `/sugerencias/:id` | Eliminación de sugerencia | `x-user-role: admin` |
| **Comentarios**| `GET` | `/sugerencias/:id/comentarios`| Obtención de comentarios en hilo | `x-user-role` |
| **Comentarios**| `POST`| `/sugerencias/:id/comentarios`| Publicación de comentario | `x-user-role`, `Content-Type` |
| **Secretaría** | `POST` | `/usuarios/registro-masivo` | Carga de lote de usuarios | `x-user-role: secretaria` |
| **Secretaría** | `POST` | `/usuarios` | Registro individual de usuario (valida M10) | `x-user-role: secretaria` |
| **Secretaría** | `GET` | `/usuarios` | Obtención de nómina institucional | `x-user-role: secretaria` |
| **Usuarios** | `PUT` | `/usuarios/:id/foto` | Actualización de avatar/foto | - |
| **Usuarios** | `PUT` | `/usuarios/:id` | Modificación de datos generales | - |
| **Usuarios** | `DELETE`| `/usuarios/:id` | Baja física de cuenta | `x-user-role: secretaria` |
| **Mantenimiento**| `GET` | `/sugerencias/mantenimiento`| Sugerencias asignadas al área física | `x-user-role: mantenimiento` |
| **Mantenimiento**| `PATCH`| `/sugerencias/:id/estado` | Cambio de estado de resolución | `x-user-role` |
| **Mantenimiento**| `GET` | `/mantenimiento/tareas` | Consulta de tareas operativas | `x-user-role: mantenimiento` |
| **Mantenimiento**| `POST`| `/mantenimiento/tareas` | Creación de tarea de mantenimiento | `x-user-role: mantenimiento` |
| **Mantenimiento**| `DELETE`| `/mantenimiento/tareas/:id` | Remoción de tarea completada | `x-user-role: mantenimiento` |
