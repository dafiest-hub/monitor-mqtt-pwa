# Monitor MQTT - PWA

Una Progressive Web App (PWA) sencilla y robusta para monitorear valores MQTT en tiempo real desde tu celular.

## Características

- Conexión a brokers MQTT públicos o privados
- Visualización en tiempo real del último valor recibido
- Publicación de mensajes al tópico
- Instalable como aplicación en el celular
- Funciona offline (una vez instalada)
- Diseño responsivo y moderno
- Guarda la configuración automáticamente

## Archivos del proyecto

- `index.html` - Página principal de la aplicación
- `app.js` - Lógica de conexión MQTT y manejo de la interfaz
- `styles.css` - Estilos responsivos
- `manifest.json` - Configuración de la PWA
- `service-worker.js` - Service Worker para funcionalidad offline
- `crear-iconos.html` - Generador de iconos para la PWA
- `icon-192.png` - Icono de 192x192 (generar)
- `icon-512.png` - Icono de 512x512 (generar)

## Instalación

### 1. Generar los iconos

Abre el archivo `crear-iconos.html` en tu navegador y descarga ambos iconos:
- icon-192.png
- icon-512.png

Guárdalos en la misma carpeta que el resto de archivos.

### 2. Servir la aplicación

Para que la PWA funcione correctamente, necesitas servir los archivos a través de HTTPS. Tienes varias opciones:

#### Opción A: Servidor local con Python (para desarrollo)

```bash
# Python 3
python -m http.server 8000

# Luego accede a: http://localhost:8000
```

#### Opción B: Usar un servicio de hosting gratuito

Puedes subir los archivos a:
- **GitHub Pages** (gratis, con HTTPS)
- **Netlify** (gratis, con HTTPS)
- **Vercel** (gratis, con HTTPS)
- **Firebase Hosting** (gratis, con HTTPS)

### 3. Instalar en tu celular

#### En Android (Chrome):

1. Abre la aplicación en Chrome
2. Espera a que aparezca el mensaje "Instalar App" o
3. Toca el menú (⋮) > "Agregar a pantalla de inicio" o "Instalar aplicación"
4. Confirma la instalación
5. La app aparecerá con su icono en tu pantalla de inicio

#### En iOS (Safari):

1. Abre la aplicación en Safari
2. Toca el botón de compartir (⬆️)
3. Selecciona "Agregar a pantalla de inicio"
4. Confirma con "Agregar"
5. La app aparecerá con su icono en tu pantalla de inicio

## Uso

### Configuración inicial

1. **Broker MQTT**: Dirección del broker (ej: `broker.hivemq.com`)
2. **Puerto**: Puerto WebSocket del broker (ej: `8000` para HiveMQ)
3. **Tópico**: Tu tópico único (ej: `usuario/sensor/temperatura`)

### Brokers MQTT públicos gratuitos

- **HiveMQ**:
  - Broker: `broker.hivemq.com`
  - Puerto: `8000`

- **Eclipse Mosquitto**:
  - Broker: `test.mosquitto.org`
  - Puerto: `8080`

- **EMQX**:
  - Broker: `broker.emqx.io`
  - Puerto: `8083`

### Conectar y recibir datos

1. Ingresa la configuración del broker
2. Pulsa "Conectar"
3. Cuando el estado cambie a "Conectado", la app empezará a escuchar
4. Cualquier mensaje publicado al tópico aparecerá en pantalla

### Publicar mensajes

1. Asegúrate de estar conectado
2. Escribe un mensaje en el campo "Mensaje"
3. Pulsa "Publicar" o presiona Enter
4. El mensaje se enviará al tópico configurado

## Publicar desde otro dispositivo

Para probar la aplicación, puedes publicar mensajes desde:

### Línea de comandos (con mosquitto_pub):

```bash
mosquitto_pub -h broker.hivemq.com -p 1883 -t "mi/topico/unico" -m "Hola desde terminal"
```

### MQTT Explorer (aplicación de escritorio):

1. Descarga MQTT Explorer
2. Conecta al mismo broker y puerto (usa 1883 para conexiones TCP)
3. Publica mensajes al mismo tópico

### Otra instancia de la PWA:

Abre la misma PWA en otro dispositivo o navegador y usa la función de publicar.

## Características técnicas

- **Reconexión automática**: Si se pierde la conexión, intenta reconectar automáticamente
- **Persistencia**: La configuración se guarda en localStorage
- **Offline-ready**: Una vez instalada, la interfaz funciona sin conexión
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Animaciones**: Feedback visual cuando llegan nuevos valores

## Solución de problemas

### No puedo conectar al broker

- Verifica que el broker y puerto sean correctos
- Asegúrate de usar el puerto WebSocket (no el puerto MQTT estándar)
- Algunos brokers requieren HTTPS para conexiones WSS

### No aparece la opción de instalar

- Asegúrate de estar usando HTTPS (no http://)
- Verifica que los iconos estén en la carpeta correcta
- Recarga la página completamente

### Los mensajes no llegan

- Verifica que estés suscrito al tópico correcto
- Asegúrate de que otro dispositivo esté publicando al mismo tópico
- Revisa la consola del navegador para ver errores

## Personalización

Puedes personalizar fácilmente:

- **Colores**: Modifica las variables de color en `styles.css`
- **Iconos**: Edita `crear-iconos.html` para cambiar el diseño
- **Nombre de la app**: Cambia el campo "name" en `manifest.json`

## Seguridad

Esta aplicación es para uso educativo y desarrollo. Para producción:

- Usa brokers MQTT con autenticación
- Implementa TLS/SSL (WSS en lugar de WS)
- No expongas credenciales en el código
- Valida y sanitiza todos los mensajes recibidos

## Licencia

Libre para uso personal y educativo.
