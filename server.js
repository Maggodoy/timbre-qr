const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Variables de Entorno
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Cambiar en Render

// Estado del sistema en memoria (Configuración dinámica)
let config = {
  isMuted: false,                  // Silenciar el timbre
  cooldownSeconds: 60,            // Tiempo entre toques
  maxDistanceMeters: 50,          // Radio del GPS
  customMessage: '🔔 ¡Atención! Hay alguien tocando el timbre en la puerta.',
  homeCoords: { lat: -32.9468, lng: -60.6393 } // Rosario
};

let lastRingTimestamp = 0;
let ringHistory = []; // Registro de visitas recientess

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Middleware para proteger rutas de administración
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['x-admin-token'];
  if (authHeader !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Acceso no autorizado.' });
  }
  next();
}

// ==========================================
// RUTAS PÚBLICAS (Cliente)
// ==========================================

app.post('/api/ring-bell', async (req, res) => {
  const { lat, lng } = req.body || {};
  const now = Date.now();

  // 1. Mute
  if (config.isMuted) {
    return res.status(503).json({ 
      error: 'El timbre se encuentra desactivado temporalmente.' 
    });
  }

  // 2. Cooldown
  const cooldownMs = config.cooldownSeconds * 1000;
  if (now - lastRingTimestamp < cooldownMs) {
    const remainingSeconds = Math.ceil((cooldownMs - (now - lastRingTimestamp)) / 1000);
    return res.status(429).json({ 
      error: `El timbre ya fue tocado. Por favor aguardá ${remainingSeconds} segundos.` 
    });
  }

  // 3. Geofencing
  if (lat && lng) {
    const distance = getDistanceInMeters(lat, lng, config.homeCoords.lat, config.homeCoords.lng);
    if (distance > config.maxDistanceMeters) {
      return res.status(403).json({ error: 'Estás demasiado lejos para tocar el timbre.' });
    }
  }

  // 4. Envío a Telegram
  try {
    const mensaje = encodeURIComponent(config.customMessage);
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${mensaje}&disable_notification=false`;

    const response = await fetch(telegramUrl);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Error al comunicarse con Telegram');
    }

    lastRingTimestamp = now;
    ringHistory.unshift({ timestamp: new Date().toISOString(), status: 'success' });
    if (ringHistory.length > 20) ringHistory.pop(); // Mantener últimas 20 visitas

    return res.json({ 
      success: true, 
      message: '¡El timbre está sonando! En breve te atienden.' 
    });

  } catch (error) {
    console.error('Error al enviar mensaje por Telegram:', error);
    return res.status(500).json({ 
      error: 'Hubo un inconveniente al notificar el timbre.' 
    });
  }
});

// ==========================================
// RUTAS PRIVADAS (Dashboard)
// ==========================================

// Login de admin
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_PASSWORD });
  }
  return res.status(401).json({ error: 'Contraseña incorrecta.' });
});

// Obtener estado y configuración
app.get('/api/admin/config', requireAdminAuth, (req, res) => {
  res.json({
    config,
    history: ringHistory
  });
});

// Actualizar configuración
app.post('/api/admin/config', requireAdminAuth, (req, res) => {
  const { isMuted, cooldownSeconds, maxDistanceMeters, customMessage } = req.body;

  if (typeof isMuted === 'boolean') config.isMuted = isMuted;
  if (cooldownSeconds) config.cooldownSeconds = Number(cooldownSeconds);
  if (maxDistanceMeters) config.maxDistanceMeters = Number(maxDistanceMeters);
  if (customMessage) config.customMessage = customMessage;

  res.json({ success: true, config });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));