const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Variables del Bot de Telegram (Tomadas de las variables de entorno de Render)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Control local de timbre
let lastRingTimestamp = 0;
const COOLDOWN_MS = 60 * 1000; // 1 minuto de espera
const HOME_COORDS = { lat: -32.9468, lng: -60.6393 }; // Rosario
const MAX_DISTANCE_METERS = 50; 

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// RUTA PRINCIPAL: Tocar el timbre
app.post('/api/ring-bell', async (req, res) => {
  const { lat, lng } = req.body || {};
  const now = Date.now();

  // 1. Anti-Spam
  if (now - lastRingTimestamp < COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastRingTimestamp)) / 1000);
    return res.status(429).json({ 
      error: `El timbre ya fue tocado. Por favor aguardá ${remainingSeconds} segundos.` 
    });
  }

  // 2. Control opcional por Geolocalización
  if (lat && lng) {
    const distance = getDistanceInMeters(lat, lng, HOME_COORDS.lat, HOME_COORDS.lng);
    if (distance > MAX_DISTANCE_METERS) {
      return res.status(403).json({ error: 'Estás demasiado lejos de la vivienda para tocar el timbre.' });
    }
  }

  // 3. Envío de notificación por Telegram
  try {
    const mensaje = encodeURIComponent('🔔 ¡Atención! Hay alguien tocando el timbre en la puerta.');
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${mensaje}`;

    const response = await fetch(telegramUrl);
    const data = await response.json();

    if (!data.ok) {
      console.error('Respuesta de error de Telegram:', data);
      throw new Error(data.description || 'Error al comunicarse con Telegram');
    }

    lastRingTimestamp = now;
    console.log('🔔 Notificación de timbre enviada con éxito a Telegram.');

    return res.json({ 
      success: true, 
      message: '¡El timbre está sonando! En breve te atienden.' 
    });

  } catch (error) {
    console.error('Error al enviar mensaje por Telegram:', error);
    return res.status(500).json({ 
      error: 'Hubo un inconveniente al notificar el timbre. Reintentá en unos momentos.' 
    });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor del Timbre QR activo 🔔');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});