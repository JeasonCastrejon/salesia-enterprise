# Guía de implementación por fases

## FASE 01 - Análisis
Problema: registrar operaciones comerciales y convertirlas en información analítica.
Flujo: cliente -> pedido/venta -> pago -> inventario -> dataset -> análisis -> dashboard/reportes.

## FASE 02 - Arquitectura
React/TypeScript consume FastAPI mediante REST. FastAPI usa SQLAlchemy para PostgreSQL.
El módulo statistics realiza media, mediana y comparación. probability realiza Bayes.

## FASE 03 - UX/UI
Interfaz empresarial con sidebar, barra superior, tarjetas KPI, tablas, formularios y gráficos.
Se contemplan estados de carga, vacío y error.

## FASE 04 - PostgreSQL
Las tablas principales se crean automáticamente al iniciar el backend y se carga una semilla demo.

## FASE 05 - Backend
FastAPI documenta automáticamente los endpoints en /docs.

## FASE 06 - Frontend
Vite + React + TypeScript. El token JWT se conserva en localStorage y se envía al backend.

## FASE 07 - Clientes y productos
CRUD básico de clientes y productos, además de categorías.

## FASE 08 - Ventas e inventario
Una venta registra detalles, calcula subtotal/total, registra pago y descuenta stock.

## FASE 09 - Semana 07
- Media
- Mediana
- Comparación media/mediana
- Variables estadísticas
- Variable aleatoria descriptiva
- Probabilidad
- Teorema de Bayes

## FASE 10 - Analytics
KPIs, ventas por día, ventas por producto y media/mediana.

## FASE 11 - Insights
Reglas determinísticas generan observaciones explicables a partir de métricas.

## FASE 12 - Reportes
Consulta de ventas y resumen estadístico.

## FASE 13 - Seguridad
JWT, roles y registro de auditoría de operaciones críticas.

## FASE 14 - Pruebas
Pruebas unitarias del motor estadístico y pruebas básicas de API.

## FASE 15 - Despliegue
Docker Compose deja frontend, backend y PostgreSQL listos para ejecución local.

## FASE 16 - Cierre
README, estructura modular y documentación de API.
