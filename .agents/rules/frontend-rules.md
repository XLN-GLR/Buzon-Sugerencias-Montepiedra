# Reglas Técnicas del Frontend - Buzón de Sugerencias Montepiedra

Estas reglas son de cumplimiento obligatorio para cualquier intervención del Agente de IA o desarrollador en el frontend de este proyecto:

## 1. Alcance y Restricciones
- **Exclusividad de Frontend:** Solo realizar cambios dentro del directorio `frontend/`. Bajo ninguna circunstancia alterar, renombrar, mover o eliminar archivos dentro de `backend/`.
- **Integridad de Código Existente:** No alterar la lógica de negocio, componentes, contratos ni estilos existentes salvo que sea explícitamente solicitado por el usuario en una tarea acotada.

## 2. Calidad de Código y Estilo
- **JavaScript Moderno:** Usar ECMAScript 2022+, React 18 functional components con hooks (`useState`, `useEffect`, `useContext`, `useMemo`, `useCallback`).
- **Modularidad:** Mantener componentes pequeños, desacoplados y con responsabilidad única.
- **Manejo de Estilos:**
  - Emplear siempre las variables de diseño definidas en `src/index.css` (`--color-primary`, `--color-bg`, `--font-title`, etc.).
  - Para componentes estructurales, utilizar CSS Modules (`*.module.css`).
  - No escribir clases ad-hoc que rompan la coherencia del Design System.

## 3. Seguridad y Privacidad
- **Cero Exposición de Secretos:** Nunca incluir API keys maestras, service role keys, contraseñas o tokens sensibles en el código del frontend. Toda variable pública debe usar el prefijo `VITE_`.
- **Validaciones en Cliente:** Toda entrada de datos debe ser validada en el cliente (longitud, formato y algoritmo Módulo 10 para cédulas).
- **Protección de Identidad:** Respetar la bandera `es_anonimo: true` en todas las pantallas públicas.

## 4. Flujo de Trabajo (Vibe Coding Guide)
- Respetar el ciclo de 9 pasos: LEER -> ENTENDER -> PLANIFICAR -> IMPLEMENTAR -> PROBAR -> REVISAR -> CORREGIR -> CONFIRMAR (COMMIT) -> ACTUALIZAR DOCUMENTACIÓN.
- Siempre desarrollar en **Rebanadas Verticales** (Vertical Slices): no intentar reescribir capas horizontales completas; abordar un flujo de usuario a la vez.
