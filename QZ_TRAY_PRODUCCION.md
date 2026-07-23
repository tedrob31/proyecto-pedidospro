# Guía de Producción: QZ Tray sin Alertas (Silencioso)

Cuando pones la aplicación en un dominio HTTPS en producción (ej. `https://pedidospro.r4tlabs.com`), el navegador bloquea la conexión a QZ Tray (`ws://localhost:8181`) por ser contenido mixto inseguro.
Para solucionar esto, QZ Tray usa `wss://localhost:8181`. Sin embargo, te mostrará un cartel de **"Untrusted Website" (Acción Requerida)** cada vez que imprimas.

Para silenciar esta alerta, debes crear un certificado digital gratuito (auto-firmado), poner la llave pública en tu aplicación web y guardar la llave privada en tu servidor para firmar peticiones de forma segura.

## Pasos para generar tus Llaves

Ya que tienes un VPS con Linux (donde corre Docker), la forma más fácil es conectarte por SSH a tu VPS y correr los siguientes comandos de OpenSSL:

### 1. Crear llave privada (private key)
```bash
openssl genrsa -out private-key.pem 2048
```

### 2. Generar archivo de solicitud de certificado (CSR)
```bash
openssl req -new -key private-key.pem -out request.csr
```
*Nota: Te pedirá datos (País, Estado, etc.). Puedes dejar la mayoría en blanco o poner datos ficticios, pero en **Common Name (CN)** pon: `pedidospro.r4tlabs.com`*

### 3. Crear el Certificado Público (Válido por 10 años)
```bash
openssl x509 -req -days 3650 -in request.csr -signkey private-key.pem -out digital-certificate.txt
```

---

## Qué hacer con estos archivos

Una vez que generes `private-key.pem` y `digital-certificate.txt`, debes colocarlos en tu proyecto:

### A. Certificado Público (`digital-certificate.txt`)
Copia este archivo tal cual y pégalo dentro de la carpeta `public/` de tu proyecto Next.js, quedando así: `public/digital-certificate.txt`.
*(Si usas Docker, asegúrate de que el archivo esté en el repositorio antes de hacer el build, para que se copie dentro de la imagen).*

### B. Llave Privada (`private-key.pem`)
Este archivo es secreto. **Nunca** debe ir en la carpeta pública.
Copia todo su contenido (incluyendo los textos `-----BEGIN RSA PRIVATE KEY-----` y `-----END RSA PRIVATE KEY-----`) y colócalo como una variable de entorno en tu servidor o VPS (en el archivo `.env` al lado del `docker-compose.yml`):

```env
# Ejemplo de archivo .env en tu VPS
QZ_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAwZ...\n...mas texto...\n-----END RSA PRIVATE KEY-----"
```
*(Es importante cambiar los saltos de línea reales por el texto literal `\n` si usas una sola línea en Docker, o configurar multilínea)*.

---

## Verificación

Una vez que:
1. El archivo `digital-certificate.txt` exista en `https://pedidospro.r4tlabs.com/digital-certificate.txt`
2. La variable `QZ_PRIVATE_KEY` esté inyectada en tu contenedor Docker...

QZ Tray se conectará, verificará la llave pública con tu API `/api/qz-sign` de forma totalmente transparente e imprimirá **sin mostrar ninguna alerta al usuario**.
