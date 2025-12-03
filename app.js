// ===== CONFIGURACIÓN - EDITA AQUÍ =====
const MQTT_CONFIG = {
    broker: 'broker.hivemq.com',     // Cambia aquí el broker
    port: 8884,                       // Puerto WSS
    topic: 'cfe/monitor/fuente',     // Tópico MQTT (valores: CFE o GENERADOR)
    path: '/mqtt'                     // Ruta del WebSocket
};

const DISPOSITIVO = {
    id: 'DIS-2024-001',              // ID del dispositivo
    ubicacion: 'Edificio Principal'  // Ubicación del dispositivo
};

const AUTH_CREDENTIALS = {
    username: 'generac',
    password: 'tymse-generac2025'
};
// ======================================

// Variables globales
let client = null;
let isConnected = false;
let deferredPrompt;
let isAuthenticated = false;
let messageReceivedTimeout = null;
let hasReceivedMessage = false;

// Elementos del DOM
const connectBtn = document.getElementById('connectBtn');
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('statusText');
const valueDisplay = document.getElementById('valueDisplay');
const timestamp = document.getElementById('timestamp');
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');
const deviceInfo = document.getElementById('deviceInfo');
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authError = document.getElementById('authError');

// Mostrar información del dispositivo
if (deviceInfo) {
    deviceInfo.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>ID Dispositivo:</strong> ${DISPOSITIVO.id}
        </div>
        <div>
            <strong>Ubicación:</strong> ${DISPOSITIVO.ubicacion}
        </div>
    `;
}

// Actualizar estado de conexión
function updateStatus(connected, message) {
    isConnected = connected;
    statusText.textContent = message;

    if (connected) {
        statusDot.className = 'status-dot connected';
        connectBtn.textContent = 'Desconectar';
        connectBtn.classList.add('connected');
    } else {
        statusDot.className = 'status-dot disconnected';
        connectBtn.textContent = 'Conectar';
        connectBtn.classList.remove('connected');
    }
}

// Mostrar valor recibido y cambiar color de fondo
function displayValue(value) {
    const valorLimpio = value.trim().toUpperCase();

    // Marcar que se ha recibido un mensaje
    hasReceivedMessage = true;

    // Limpiar el timeout si existe
    if (messageReceivedTimeout) {
        clearTimeout(messageReceivedTimeout);
        messageReceivedTimeout = null;
    }

    // Determinar el color de fondo según la fuente
    let backgroundColor;
    if (valorLimpio === 'CFE') {
        backgroundColor = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'; // Azul
    } else if (valorLimpio === 'GENERADOR') {
        backgroundColor = 'linear-gradient(135deg, #c31432 0%, #e85d75 100%)'; // Rojo
    } else if (valorLimpio === 'SIN INTERNET') {
        backgroundColor = 'linear-gradient(135deg, #434343 0%, #000000 100%)'; // Negro/Gris
    } else {
        backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; // Morado (default)
    }

    // Cambiar color de fondo del body
    document.body.style.background = backgroundColor;

    // Mostrar el valor
    valueDisplay.innerHTML = `<div class="value">${valorLimpio}</div>`;

    const now = new Date();
    timestamp.textContent = `Última actualización: ${now.toLocaleString('es-ES')}`;

    // Animación
    valueDisplay.classList.add('pulse');
    setTimeout(() => valueDisplay.classList.remove('pulse'), 500);
}

// Mostrar mensaje de sin internet
function showNoInternet() {
    displayValue('SIN INTERNET');
    console.log('No se recibieron mensajes en 30 segundos - Mostrando SIN INTERNET');
}

// Funciones de Autenticación
function checkAuthentication() {
    const authStatus = localStorage.getItem('mqttMonitorAuth');
    if (authStatus === 'authorized') {
        isAuthenticated = true;
        authModal.classList.remove('active');
    } else {
        isAuthenticated = false;
        authModal.classList.add('active');
    }
    return isAuthenticated;
}

function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
        // Autenticación exitosa
        localStorage.setItem('mqttMonitorAuth', 'authorized');
        isAuthenticated = true;
        authModal.classList.remove('active');
        authError.textContent = '';

        // Limpiar formulario
        authForm.reset();

        console.log('Autenticación exitosa');
    } else {
        // Credenciales incorrectas
        authError.textContent = 'Usuario o contraseña incorrectos';
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

// Conectar a MQTT
function connectMQTT() {
    updateStatus(false, 'Conectando...');

    // Detectar si estamos en HTTPS y usar wss:// en lugar de ws://
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const url = `${protocol}${MQTT_CONFIG.broker}:${MQTT_CONFIG.port}/mqtt`;

    console.log('Conectando a:', url);

    try {
        client = mqtt.connect(url, {
            clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
            clean: true,
            reconnectPeriod: 5000,
            connectTimeout: 10000,
            keepalive: 60
        });

        client.on('connect', () => {
            console.log('Conectado a MQTT');
            updateStatus(true, 'Conectado');

            // Reiniciar flag de mensaje recibido
            hasReceivedMessage = false;

            client.subscribe(MQTT_CONFIG.topic, (err) => {
                if (err) {
                    console.error('Error al suscribirse:', err);
                    updateStatus(true, 'Conectado (error suscripción)');
                } else {
                    console.log('Suscrito a:', MQTT_CONFIG.topic);
                    updateStatus(true, `Conectado - Escuchando`);

                    // Enviar mensaje STATUS al conectarse
                    const statusTopic = `${MQTT_CONFIG.topic}/${DISPOSITIVO.id}`;
                    client.publish(statusTopic, 'STATUS', { qos: 0, retain: false }, (err) => {
                        if (err) {
                            console.error('Error al enviar STATUS:', err);
                        } else {
                            console.log('Mensaje STATUS enviado a:', statusTopic);
                        }
                    });

                    // Iniciar timeout de 30 segundos para verificar si se reciben mensajes
                    messageReceivedTimeout = setTimeout(() => {
                        if (!hasReceivedMessage) {
                            showNoInternet();
                        }
                    }, 30000); // 30 segundos
                }
            });
        });

        client.on('message', (topic, message) => {
            console.log('Mensaje recibido:', message.toString());
            displayValue(message.toString());
        });

        client.on('error', (err) => {
            console.error('Error MQTT:', err);
            updateStatus(false, 'Error de conexión');
        });

        client.on('close', () => {
            console.log('Conexión cerrada');
            updateStatus(false, 'Desconectado');
        });

        client.on('offline', () => {
            console.log('Cliente offline');
            updateStatus(false, 'Sin conexión');
        });

        client.on('reconnect', () => {
            console.log('Reconectando...');
            updateStatus(false, 'Reconectando...');
        });

    } catch (err) {
        console.error('Error al conectar:', err);
        updateStatus(false, 'Error al conectar');
    }
}

// Desconectar de MQTT
function disconnectMQTT() {
    // Limpiar timeout si existe
    if (messageReceivedTimeout) {
        clearTimeout(messageReceivedTimeout);
        messageReceivedTimeout = null;
    }

    if (client) {
        client.end();
        client = null;
    }

    hasReceivedMessage = false;
    updateStatus(false, 'Desconectado');
}

// Event Listeners
authForm.addEventListener('submit', handleLogin);

connectBtn.addEventListener('click', () => {
    if (!isAuthenticated) {
        authModal.classList.add('active');
        return;
    }

    if (isConnected) {
        disconnectMQTT();
    } else {
        connectMQTT();
    }
});

// PWA Installation
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // El botón ya es visible, solo habilitamos la funcionalidad
    installBtn.disabled = false;
    installBtn.style.opacity = '1';
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
        alert('Para instalar esta app:\n\n📱 Android: Usa el menú del navegador > "Agregar a pantalla de inicio"\n🍎 iOS: Usa el botón compartir > "Agregar a pantalla de inicio"');
        return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response: ${outcome}`);
    if (outcome === 'accepted') {
        installPrompt.style.display = 'none';
    }
    deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
    console.log('PWA instalada exitosamente');
    installPrompt.style.display = 'none';
});

// Detectar cuando la app se vuelve visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('App visible');
    }
});

// Verificar autenticación al cargar la página
checkAuthentication();
