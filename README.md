# Palvi Dashboard

Reporte ejecutivo de métricas B2B SaaS. Construido con React + TypeScript.

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

Abrí http://localhost:5173 en el navegador.

El archivo `public/metrics.json` ya está incluido en el repo.

## Decisiones técnicas

**React + TypeScript + Vite** — stack base requerido. Vite por velocidad de setup y HMR instantáneo.

**Recharts** — librería de charts construida sobre React. Elegida por su API declarativa y buena integración con TypeScript. Alternativa considerada: Chart.js, descartada por requerir manejo manual del DOM.

**Tailwind CSS** — utilidades inline para iterar rápido en UI sin saltar entre archivos CSS. Permite mantener el estilo cerca del componente.

**Sin estado global (Redux/Zustand)** — la app tiene un único estado relevante: el dataset seleccionado. `useState` en `App.tsx` es suficiente y proporcional al problema.

**Sin backend** — el JSON se carga via `fetch('/metrics.json')` desde `public/`. Correcto para este scope: los datos son estáticos y no hay autenticación.

**Win rate calculado como suma acumulada** — `sum(deals_won) / sum(deals_won + deals_lost)` sobre una ventana de 30 días, no promedio de ratios diarios. Esto evita distorsiones en días con pocos deals.

**Tendencia comparando ventanas de 30 días** — se compara el promedio de los últimos 30 días contra los 30 anteriores. Un delta > 3% se considera tendencia. El campo `direction` del dataset determina si esa tendencia es buena o mala.

**Nulls manejados explícitamente** — métricas como `avg_response_time_min` pueden ser null (días sin leads). Las funciones de promedio filtran nulls antes de calcular.

## Segunda iteración

**Servicio de análisis en Python** — mover el cálculo de tendencias, detección de anomalías y proyecciones a un microservicio FastAPI. Python tiene mejor ecosistema para estadística (pandas, statsmodels). El frontend consumiría una API REST en lugar de procesar el JSON directamente.

**Alertas inteligentes** — detectar automáticamente qué métrica empeoró más en las últimas 2 semanas y mostrarla destacada al abrir el dashboard. El Jefe de Ventas no debería tener que buscar el problema.

**Selector de período** — permitir comparar semana actual vs semana anterior, o mes vs mes anterior, en lugar de ventanas fijas de 7/30/90 días.

**Tests** — cubrir las funciones de `dataUtils.ts` con Jest. Son funciones puras, fáciles de testear y críticas para la correctitud del reporte.