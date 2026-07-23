# Pedidos Pro

**Pedidos Pro** es una aplicación web interna orientada a la gestión avanzada, consulta de inventario, procesamiento de lotes fotográficos y automatización de impresión de etiquetas para proveedores. Está diseñada para conectarse directamente con **Google Sheets** (como base de datos dinámica) y **Google Drive / Cloudinary** (para el almacenamiento y sincronización de fotografías de los pedidos).

## 🚀 Características Principales

*   **Gestión de Proveedores (CRUD):** Lee, crea, edita y elimina proveedores directamente desde la web, reflejando los cambios físicamente en Google Sheets.
*   **Procesamiento de Pedidos Masivos:** Selecciona múltiples proveedores a la vez, extrae los pedidos asignados a cada hoja en tiempo real, genera reportes consolidados y permite la descarga de fotos organizadas en ZIPs (separadas por subcarpetas).
*   **Gestión de Fotografías (Sincronización):** Lista códigos de pedidos y verifica la existencia de sus fotos. Permite subir nuevas fotos (con previsualización interactiva) o eliminarlas masivamente en paralelo.
*   **Impresión Térmica Inteligente (QZ Tray):** Imprime etiquetas TSPL en lotes para impresoras térmicas. Incorpora lógica automática para códigos de gran longitud, códigos QR conmutables, y padding inteligente para asegurar que los stickers de distintos proveedores no se mezclen en la misma fila.
*   **Sistema de Configuración JSON:** Permite cambiar parámetros técnicos en tiempo real (ID de hojas, mapeo de columnas, credenciales) sin necesidad de re-compilar el código gracias a un archivo local de persistencia (`data/db.json`).

## 🛠️ Tecnologías Usadas

*   **Frontend:** [Next.js 15](https://nextjs.org/) (App Router), React, Tailwind CSS (para interfaces modernas y dinámicas).
*   **Backend:** API Routes nativas de Next.js, ejecutadas en Node.js.
*   **Bases de Datos & Almacenamiento:**
    *   **Google Sheets API (googleapis):** Actúa como la fuente de verdad (CRUD de proveedores, lectura de pedidos y stock).
    *   **Google Drive API:** Búsqueda rápida de carpetas e imágenes.
    *   **Disco Local (`data/db.json` & `sync_state.json`):** Persistencia ligera para configuraciones y estados de sincronización de imágenes sin latencia de red.
*   **Integraciones Extra:**
    *   **QZ Tray (`qz-tray`):** Para comunicación silenciosa y directa por websockets con la impresora térmica local.
    *   **JSZip & FileSaver.js:** Para la consolidación de fotos y descarga masiva al cliente sin sobrecargar el servidor.
*   **DevOps & Producción:** Preparado para despliegue por **Docker** (Multi-stage build) usando output `standalone`, gestionado a través de Docker Compose y Traefik (HTTPS).

## 💻 Entorno de Desarrollo

El proyecto requiere credenciales de API para conectarse a Google. Asegúrate de tener el archivo `credentials.json` montado en la ruta correcta, y configurar tu archivo `.env.local` antes de iniciar.

Para arrancar el servidor en local:
```bash
npm install
npm run dev
```

El servidor local estará disponible en `http://localhost:3000`.

## 📦 Despliegue en Producción (Docker)

El proyecto viene preparado con un `Dockerfile` y un `docker-compose.yml`. Al usar el modo `standalone` de Next.js, la imagen es ultra ligera.
Para levantar el proyecto:
```bash
docker compose up -d --build
```
*Asegúrate de revisar el archivo [QZ_TRAY_PRODUCCION.md](./QZ_TRAY_PRODUCCION.md) para generar los certificados de impresión silenciosa en HTTPS.*
