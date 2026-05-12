# Palvi Dashboard

Reporte ejecutivo para B2B SaaS. React + TypeScript + Vite.

```bash
npm install
npm run dev
```

Abre http://localhost:5173. El JSON con los 4 datasets ya está en `public/metrics.json`.

## Decisiones técnicas

**Apunté a comunicar, no a mostrar todo lo que el JSON permite.** El usuario es un Jefe de Ventas con 5 minutos. Su pregunta no es "qué pasó esta semana" sino "dónde pongo foco hoy". Esa pregunta es la que organiza el dashboard: arriba la respuesta (Foco del Día), abajo el detalle (KPIs, tendencias, funnel).

**El Foco del Día detecta automáticamente la métrica más crítica de cada dataset** comparando ventanas de 30 días, usando el campo `direction` del JSON para saber si subir es bueno o malo. En Dataset A detecta deals estancados creciendo; en D, tiempo de respuesta degradándose. Sin esta lógica, el dashboard se vería igual en los 4 datasets — y eso era exactamente lo que había que evitar.

**Cada métrica tiene definición y período visibles.** Un número solo no comunica. "175.6 deals estancados" sin contexto es ruido; con `Promedio últimos 7 días · vs ~96 hace 3 meses` es información accionable. Esto vale para las tarjetas KPI, el panel de foco y el modal.

**El modal de análisis profundo aplica benchmarks B2B realistas** (win rate 35%, lead→qualified 50%) para detectar cuellos de botella en el funnel, en lugar de marcar el porcentaje más bajo. Sin benchmarks, el "cuello" siempre sería tráfico→lead (2-3%), lo cual es normal en B2B y por tanto inútil como alerta.

**Stack:** React/Typescript(Base) + Vite por velocidad de setup. Recharts por API declarativa y buena integración con TypeScript. Tailwind para iterar UI sin saltar entre archivos. Sin Redux porque hay un único estado relevante (dataset seleccionado) — `useState` es proporcional al problema. El JSON se importa directo desde `public/` porque el scope no justifica backend.

**Cálculos correctos donde importa:** win rate como `sum(won) / sum(won+lost)` sobre ventana, no promedio de ratios diarios. Nulls filtrados antes de promediar (`avg_response_time_min` puede ser null en días sin leads). Tendencias comparando promedios de ventanas, no valores puntuales.

**Uso de IA:** Claude para iteración rápida de componentes y refinamiento visual. Las decisiones de qué mostrar, cómo estructurar la jerarquía del dashboard, qué constituye una alerta vs ruido, y los benchmarks B2B fueron mías. La IA aceleró la ejecución; no decidió el producto.

## Segunda iteración

**Backend de análisis en Python.** Hoy todo el cálculo de tendencias, proyecciones y correlaciones vive en el frontend. Funciona para este scope pero no escala: si el dataset fuera 10x más grande o necesitara modelos estadísticos serios (regresión, detección de anomalías con prophet/statsmodels), un servicio FastAPI separado tendría más sentido. El frontend solo renderizaría.

**Alertas configurables por usuario.** Hoy el Foco del Día prioriza con lógica fija. En producción, distintos roles necesitarían distintos focos — un Director Comercial quiere ver pipeline, un VP de Customer Success quiere ver tickets. Permitir configurar qué métricas alimentan el algoritmo de "qué es el problema más urgente hoy".

**Comparación período sobre período flexible.** Hoy las comparaciones son ventanas fijas (7d, 30d, 90d). Permitir "esta semana vs la misma semana del mes anterior" o "este Q vs el Q anterior" para detectar estacionalidad real del negocio.

**Tests para `dataUtils.ts`.** Son funciones puras críticas para la correctitud del reporte. Cubrirlas con Jest sería barato y de alto valor — un bug en `calcWinRate` o `getDeltaPct` corrompe todo el dashboard silenciosamente.

**Accesibilidad y responsive.** El dashboard funciona en desktop pero no está optimizado para tablet/móvil ni cumple WCAG. Para un producto B2B real, ambos son no-negociables.