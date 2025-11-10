// Conexión WebSocket
const socket = io();

// Elementos del DOM
const currentAngleElement = document.getElementById('currentAngle');
const targetAngleElement = document.getElementById('targetAngle');
const motorStatusElement = document.getElementById('motorStatus');
const connectionStatusElement = document.getElementById('connectionStatus');
const lastUpdateElement = document.getElementById('lastUpdate');
const angleInput = document.getElementById('angleInput');
const angleSlider = document.getElementById('angleSlider');
const sliderValue = document.getElementById('sliderValue');

// Estado de la aplicación
let appState = {
    currentAngle: 45,
    targetAngle: 90,
    connected: false,
    moving: false
};

// Inicializar conexión WebSocket
socket.on('connect', () => {
    console.log('✅ Conectado al servidor');
    updateConnectionStatus(true);
});

socket.on('disconnect', () => {
    console.log('❌ Desconectado del servidor');
    updateConnectionStatus(false);
});

// Recibir actualizaciones del motor
socket.on('motor-update', (data) => {
    appState = { ...appState, ...data };
    updateUI();
});

// Actualizar interfaz de usuario
function updateUI() {
    currentAngleElement.textContent = appState.currentAngle + '°';
    targetAngleElement.textContent = appState.targetAngle + '°';
    
    // Actualizar estado del motor
    if (appState.moving) {
        motorStatusElement.textContent = '🟡 Moviéndose...';
        motorStatusElement.style.color = '#f39c12';
    } else {
        motorStatusElement.textContent = '🟢 En posición';
        motorStatusElement.style.color = '#27ae60';
    }
    
    // Actualizar slider e input
    angleSlider.value = appState.targetAngle;
    angleInput.value = appState.targetAngle;
    sliderValue.textContent = appState.targetAngle + '°';
    
    // Actualizar timestamp
    lastUpdateElement.textContent = new Date().toLocaleTimeString();
}

// Actualizar estado de conexión
function updateConnectionStatus(connected) {
    appState.connected = connected;
    
    if (connected) {
        connectionStatusElement.textContent = '✅ Conectado al servidor';
        connectionStatusElement.className = 'status-connected';
    } else {
        connectionStatusElement.textContent = '❌ Desconectado del servidor';
        connectionStatusElement.className = 'status-disconnected';
    }
}

// Establecer ángulo personalizado
function setCustomAngle() {
    const angle = parseInt(angleInput.value);
    
    if (angle >= 0 && angle <= 270) {
        setAngle(angle);
    } else {
        alert('⚠️ Por favor ingresa un ángulo entre 0 y 270 grados');
        angleInput.value = appState.targetAngle;
    }
}

// Establecer ángulo específico
function setAngle(angle) {
    if (angle < 0 || angle > 270) {
        alert('⚠️ El ángulo debe estar entre 0 y 270 grados');
        return;
    }
    
    // Enviar comando al servidor
    socket.emit('set-angle', { angle: angle });
    
    // Actualizar UI inmediatamente
    appState.targetAngle = angle;
    appState.moving = true;
    updateUI();
    
    console.log(`🎯 Solicitando movimiento a: ${angle}°`);
}

// Actualizar valor del slider
function updateSliderValue(value) {
    sliderValue.textContent = value + '°';
    angleInput.value = value;
}

// Parar motor
function stopMotor() {
    socket.emit('stop-motor');
    console.log('🛑 Solicitando parada del motor');
}

// Enter en el input
angleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        setCustomAngle();
    }
});

// Inicializar UI
updateUI();
console.log('🚀 Aplicación inicializada');