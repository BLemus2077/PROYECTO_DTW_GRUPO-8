Inventario de Autos:
Sistema web de gestión de inventario vehicular para El Salvador, desarrollado como proyecto final del curso DTW135 – Desarrollo y Técnicas de Aplicaciones Web, Ciclo I 2026, Grupo GT02.

Integrantes:
Bryan Ernesto	Lemus Pineda-LP21019
Jeffrey Jabes	Juarez Mangandi-JM21008
Luis Eduardo 	Molina Caceres-MC23015

Descripción:
Aplicación web SPA (Single Page Application) que permite gestionar un inventario de vehículos sin necesidad de backend ni base de datos. Todo funciona directamente en el navegador usando tecnologías frontend estándar.

Funcionalidades:
CRUD completo de vehículos con validación y manejo de errores
Dashboard con métricas en tiempo real procesadas por un Web Worker
Mapa interactivo de El Salvador con marcadores por departamento (Leaflet.js)
Consulta de clima en tiempo real (Open-Meteo + Geolocation API)
Almacenamiento persistente con LocalStorage y log de sesión con SessionStorage
Gráficas personalizadas dibujadas con Canvas 2D API
Diseño responsivo (móvil, tablet y escritorio)

Tecnologías
TecnologíaUsoHTML5Estructura semántica de la SPACSS3Variables, Grid, Flexbox, diseño responsivoJavaScript ES6+Lógica, módulos, async/awaitWeb Workers APICálculo de estadísticas en hilo separadoLocalStoragePersistencia de vehículos entre sesionesSessionStorageLog de acciones por sesiónFetch APIConsumo de API REST de climaGeolocation APICoordenadas GPS del usuarioCanvas 2D APIGráficas sin librerías externasLeaflet.js v1.9.4Mapa interactivo con OpenStreetMapOpen-MeteoAPI pública de clima (sin clave)

Estructura del proyecto
inventario-autos/
├── index.html          ← Punto de entrada único (SPA)
├── css/
│   └── style.css       ← Estilos, tema claro, responsivo
└── js/
    ├── app.js          ← Inicialización y event listeners
    ├── storage.js      ← LocalStorage + SessionStorage
    ├── validation.js   ← Validación de formularios
    ├── ui.js           ← Toasts, modales, navegación
    ├── geolocation.js  ← Captura de coordenadas GPS
    ├── dashboard.js    ← Métricas, gráficas Canvas, Web Worker
    ├── crud.js         ← Crear, leer, editar, eliminar
    ├── mapa.js         ← Leaflet + panel de departamentos
    ├── api.js          ← Fetch API + Open-Meteo
    └── worker.js       ← Web Worker (hilo separado)

Cómo ejecutar
Opción 1 – Servidor local:
bash# Con Python
python -m http.server 8080

# Con Node.js (npx)
npx serve .
Luego abrir http://localhost:8080 en el navegador.

Opción 2 – Abrir directamente:
Abrir index.html en el navegador. (Nota: el Web Worker y la Geolocation API requieren servidor HTTP. Se recomienda la Opción 1.)

Requerimientos técnicos implementados
RequerimientoImplementaciónCRUD completocrud.js + storage.js — crear, editar, eliminar, listar con try/catchValidacionesvalidation.js — campos requeridos, placa única, año válido, precio > 0Manipulación del DOMTabla dinámica, toasts, modales, animación de contadoresWeb Workerworker.js — estadísticas en hilo separado, comunicación por postMessageDashboarddashboard.js — 6 métricas + 4 gráficas Canvas 2DLocalStoragestorage.js — clave autoInventario_vehiculosSessionStoragestorage.js — log de acciones autoInventario_sessionFetch APIapi.js — GET a Open-Meteo, respuesta JSONGeolocation APIgeolocation.js + api.js — GPS para registro de vehículos y climaMapa interactivomapa.js — Leaflet + OpenStreetMap + 14 departamentos de El Salvador


Licencia
ProyectoDTW135, Universidad de El Salvador, Ciclo I 2026.
