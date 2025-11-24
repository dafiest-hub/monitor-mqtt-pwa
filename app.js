// Variables globales
let client = null;
let isConnected = false;
let deferredPrompt;

// Elementos del DOM
const brokerInput = document.getElementById('broker');
const portInput = document.getElementById('port');
const topicInput = document.getElementById('topic');
const connectBtn = document.getElementById('connectBtn');
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('statusText');
const valueDisplay = document.getElementById('valueDisplay');
const timestamp = document.getElementById('timestamp');
const messageInput = document.getElementById('message');
const publishBtn = document.getElementById('publishBtn');
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');

// Cargar configuración guardada
function loadConfig() {
    const savedBroker = localStorage.getItem('mqttBroker');
    const savedPort = localStorage.getItem('mqttPort');
    const savedTopic = localStorage.getItem('mqttTopic');

    if (savedBroker) brokerInput.value = savedBroker;
    if (savedPort) portInput.value = savedPort;
    if (savedTopic) topicInput.value = savedTopic;
}

// Guardar configuración
function saveConfig() {
    localStorage.setItem('mqttBroker', brokerInput.value);
    localStorage.setItem('mqttPort', portInput.value);
    localStorage.setItem('mqttTopic', topicInput.value);
}

// Actualizar estado de conexión
function updateStatus(connected, message) {
    isConnected = connected;
    statusText.textContent = message;

    if (connected) {
        statusDot.className = 'status-dot connected';
        connectBtn.textContent = 'Desconectar';
        connectBtn.classList.add('connected');
        publishBtn.disabled = false;
        disableInputs(true);
    } else {
        statusDot.className = 'status-dot disconnected';
        connectBtn.textContent = 'Conectar';
        connectBtn.classList.remove('connected');
        publishBtn.disabled = true;
        disableInputs(false);
    }
}

// Deshabilitar/habilitar inputs
function disableInputs(disable) {
    brokerInput.disabled = disable;
    portInput.disabled = disable;
    topicInput.disabled = disable;
}

// Mostrar valor recibido
function displayValue(value) {
    valueDisplay.innerHTML = `<div class="value">${value}</div>`;

    const now = new Date();
    timestamp.textContent = `Última actualización: ${now.toLocaleString('es-ES')}`;

    // Animación
    valueDisplay.classList.add('pulse');
    setTimeout(() => valueDisplay.classList.remove('pulse'), 500);
}

// Conectar a MQTT
function connectMQTT() {
    const broker = brokerInput.value.trim();
    const port = parseInt(portInput.value);
    const topic = topicInput.value.trim();

    if (!broker || !port || !topic) {
        alert('Por favor completa todos los campos');
        return;
    }

    saveConfig();
    updateStatus(false, 'Conectando...');

    // Detectar si estamos en HTTPS y usar wss:// en lugar de ws://
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const url = `${protocol}${broker}:${port}/mqtt`;

    try {
        client = mqtt.connect(url, {
            clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
            clean: true,
            reconnectPeriod: 1000,
            connectTimeout: 30000
        });

        client.on('connect', () => {
            console.log('Conectado a MQTT');
            updateStatus(true, 'Conectado');

            client.subscribe(topic, (err) => {
                if (err) {
                    console.error('Error al suscribirse:', err);
                    updateStatus(true, 'Conectado (error suscripción)');
                } else {
                    console.log('Suscrito a:', topic);
                    updateStatus(true, `Conectado - Escuchando: ${topic}`);
                }
            });
        });

        client.on('message', (receivedTopic, message) => {
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
    if (client) {
        client.end();
        client = null;
    }
    updateStatus(false, 'Desconectado');
}

// Publicar mensaje
function publishMessage() {
    if (!client || !isConnected) {
        alert('No estás conectado al broker');
        return;
    }

    const message = messageInput.value.trim();
    const topic = topicInput.value.trim();

    if (!message) {
        alert('Escribe un mensaje para publicar');
        return;
    }

    client.publish(topic, message, (err) => {
        if (err) {
            console.error('Error al publicar:', err);
            alert('Error al publicar mensaje');
        } else {
            console.log('Mensaje publicado:', message);
            messageInput.value = '';

            // Mostrar feedback
            publishBtn.textContent = 'Publicado!';
            setTimeout(() => {
                publishBtn.textContent = 'Publicar';
            }, 1500);
        }
    });
}

// Event Listeners
connectBtn.addEventListener('click', () => {
    if (isConnected) {
        disconnectMQTT();
    } else {
        connectMQTT();
    }
});

publishBtn.addEventListener('click', publishMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        publishMessage();
    }
});

// PWA Installation
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPrompt.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
        return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response: ${outcome}`);
    deferredPrompt = null;
    installPrompt.style.display = 'none';
});

window.addEventListener('appinstalled', () => {
    console.log('PWA instalada');
    deferredPrompt = null;
    installPrompt.style.display = 'none';
});

// Cargar configuración al iniciar
loadConfig();

// Detectar cuando la app se vuelve visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('App visible');
    }
});
