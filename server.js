const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Variables de estado del motor
let currentAngle = 45;
let targetAngle = 90;
let isConnected = false;
let motorMoving = false;

// Ruta principal - Sirve el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para obtener estado
app.get('/api/status', (req, res) => {
  res.json({
    currentAngle: currentAngle,
    targetAngle: targetAngle,
    connected: isConnected,
    moving: motorMoving,
    timestamp: new Date().toISOString()
  });
});

// API para establecer ángulo
app.post('/api/set-angle', (req, res) => {
  const { angle } = req.body;
  
  if (angle >= 0 && angle <= 270) {
    targetAngle = parseInt(angle);
    motorMoving = true;
    
    console.log(`🎯 Nuevo objetivo: ${targetAngle}°`);
    
    // Iniciar simulación de movimiento
    simulateMotorMovement();
    
    res.json({
      success: true,
      message: `Motor moviéndose a ${targetAngle}°`,
      targetAngle: targetAngle
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'El ángulo debe estar entre 0 y 270 grados'
    });
  }
});

// API para parar motor
app.post('/api/stop', (req, res) => {
  targetAngle = currentAngle;
  motorMoving = false;
  console.log('🛑 Motor detenido');
  
  res.json({ 
    success: true, 
    message: 'Motor detenido',
    targetAngle: targetAngle
  });
});

// WebSocket para comunicación en tiempo real
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);
  isConnected = true;
  
  // Enviar estado actual al nuevo cliente
  socket.emit('motor-update', {
    currentAngle: currentAngle,
    targetAngle: targetAngle,
    connected: true,
    moving: motorMoving
  });
  
  // Recibir comando para establecer ángulo
  socket.on('set-angle', (data) => {
    const angle = parseInt(data.angle);
    
    if (angle >= 0 && angle <= 270) {
      targetAngle = angle;
      motorMoving = true;
      
      console.log(`🎯 Ángulo vía WebSocket: ${targetAngle}°`);
      
      // Iniciar simulación
      simulateMotorMovement();
      
      // Notificar a TODOS los clientes
      io.emit('motor-update', {
        currentAngle: currentAngle,
        targetAngle: targetAngle,
        connected: true,
        moving: motorMoving
      });
    }
  });
  
  // Recibir comando para parar
  socket.on('stop-motor', () => {
    targetAngle = currentAngle;
    motorMoving = false;
    
    console.log('🛑 Motor detenido vía WebSocket');
    
    io.emit('motor-update', {
      currentAngle: currentAngle,
      targetAngle: targetAngle,
      connected: true,
      moving: motorMoving
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
    isConnected = false;
  });
});

// Simular movimiento del motor (sin ESP32 real)
function simulateMotorMovement() {
  if (motorMoving) return; // Evitar múltiples simulaciones
  
  motorMoving = true;
  const simulationSpeed = 2; // Grados por actualización
  
  const interval = setInterval(() => {
    if (currentAngle < targetAngle) {
      currentAngle += simulationSpeed;
      if (currentAngle > targetAngle) currentAngle = targetAngle;
    } else if (currentAngle > targetAngle) {
      currentAngle -= simulationSpeed;
      if (currentAngle < targetAngle) currentAngle = targetAngle;
    }
    
    // Actualizar todos los clientes
    io.emit('motor-update', {
      currentAngle: currentAngle,
      targetAngle: targetAngle,
      connected: true,
      moving: motorMoving
    });
    
    // Detener simulación cuando llegue al objetivo
    if (currentAngle === targetAngle) {
      motorMoving = false;
      clearInterval(interval);
      console.log(`✅ Posición alcanzada: ${currentAngle}°`);
      
      // Notificar que se detuvo
      io.emit('motor-update', {
        currentAngle: currentAngle,
        targetAngle: targetAngle,
        connected: true,
        moving: false
      });
    }
  }, 100); // Actualizar cada 100ms
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Accede en: http://localhost:${PORT}`);
  console.log('📡 Modo: Simulación (listo para conectar ESP32 real)');
});