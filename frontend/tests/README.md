# Directorio de Pruebas (Tests) - Frontend

Este directorio está destinado a alojar la suite de pruebas automatizadas del frontend, de acuerdo a lo establecido en el archivo `docs/TEST_PLAN.md` y la Guía de Desarrollo Guiada por IA.

---

## Estructura Sugerida
```
tests/
├── unit/            # Pruebas unitarias (validadores de cédula, helpers de formato)
├── integration/     # Pruebas de integración de componentes y contextos de React
└── e2e/             # Pruebas de extremo a extremo con Playwright
```

---

## Comandos Recomendados para Ejecución
Una vez instalados los paquetes de testing correspondientes:
- **Pruebas unitarias con Vitest:** `npm run test`
- **Pruebas E2E con Playwright:** `npx playwright test`
- **Revisión de tipos y linting:** `npm run lint`
