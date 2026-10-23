# Backend - Buzón de Sugerencias Montepiedra

Servidor API RESTful construido con **Node.js** y **Express.js**, conectado a **Supabase** (PostgreSQL) para la gestión integral de propuestas, autenticación institucional, moderación y tareas de mantenimiento de la Unidad Educativa Montepiedra.

---

## 🚀 Requisitos Previos

1. **Node.js**: Versión LTS (v18.x o superior recomendada).
2. **Proyecto en Supabase**: Base de datos PostgreSQL con las tablas `usuarios`, `sugerencias`, `votos_sugerencias`, `comentarios_sugerencias` y `tareas_mantenimiento`.
3. **Gestor de Paquetes**: `npm` (incluido con Node.js).

---

## ⚙️ Configuración del Entorno

1. Ingrese al directorio del backend:
   ```bash
   cd backend
   ```

2. Cree un archivo `.env` tomando como base la plantilla `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Defina sus variables de entorno en el archivo `.env`:
   ```env
   PORT=8080
   HOST=127.0.0.1
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=tu-api-key-anonima-o-service-role-de-supabase
   ```

---

## 📦 Instalación y Ejecución

### Instalar dependencias:
```bash
npm install
```

### Iniciar el servidor backend:
```bash
node index.js
```

El servidor estará escuchando peticiones en:
```
http://127.0.0.1:8080
```

---

## 📋 Módulos Funcionales

1. **Autenticación e Identidad (`/auth`):**
   - Validación matemática estricta de cédula ecuatoriana mediante algoritmo Módulo 10.
   - Cifrado unidireccional de contraseñas con `bcrypt` (10 salt rounds).
   - Flujo de primer ingreso con configuración de clave permanente.

2. **Buzón de Sugerencias y Votaciones (`/sugerencias`):**
   - Publicación de sugerencias con motor híbrido de moderación léxica (`hasProfanity`) mediante tokenización por palabras completas (`leo-profanity`), decodificación de leetspeak y consulta asíncrona a PurgoMalum (cero falsos positivos en términos como "computadora").
   - Anonimización automática de autor para roles no administradores si `es_anonimo: true`.
   - Sistema atómico de votación ponderada (`like` / `dislike`).
   - Moderación administrativa y respuestas oficiales.

3. **Comentarios en Hilo (`/sugerencias/:id/comentarios`):**
   - Discusión constructiva y trazabilidad de opiniones por propuesta con validación léxica.

4. **Secretaría y Nómina (`/usuarios`):**
   - Ingesta individual y masiva de nómina con verificación de integridad de cédula.

5. **Mantenimiento Institucional (`/mantenimiento`):**
   - Tablero kanban y seguimiento operativo de incidencias físicas.

---

## 🧪 Pruebas del Backend

### 1. Suite Automatizada de Moderación Léxica:
Ejecuta 23 casos de prueba verificando prevención de falsos positivos, modismos locales e insultos en inglés:
```bash
node tests/profanity.test.js
```

### 2. Pruebas de Endpoints con `pruebas.http`:
- Utilice el archivo [`pruebas.http`](pruebas.http) directamente en su editor mediante la extensión **REST Client** (VS Code) o **Thunder Client**.
- Consulte el plan de pruebas en [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) y la guía en [`tests/README.md`](tests/README.md).

---

## 📚 Estructura Documental (Guía Vibe Coding)

La documentación técnica del backend se encuentra organizada en [`docs/`](docs/):
- [`docs/PRD.md`](docs/PRD.md): Documento de requisitos del producto y alcance.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Diagrama de capas, flujo de datos y dependencias.
- [`docs/DESIGN.md`](docs/DESIGN.md): Especificación de contratos REST, códigos HTTP y formatos JSON.
- [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md): Plan de pruebas y casos de verificación.
- [`docs/SECURITY.md`](docs/SECURITY.md): Políticas de seguridad, validación M10 y hashing.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): Registro de decisiones de arquitectura (ADRs).
- [`docs/MEMORY.md`](docs/MEMORY.md): Estado dinámico de progreso y tareas vivas.
- [`RULES.md`](RULES.md): Reglas de desarrollo para el backend.
- [`TASKS.md`](TASKS.md): Plan secuencial de tareas por fases.
- [`CONTRATO_DATOS.md`](CONTRATO_DATOS.md): Especificación formal de payloads y respuestas.
