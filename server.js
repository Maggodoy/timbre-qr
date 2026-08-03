const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// 1. Inicializar Firebase con las credenciales reales
const serviceAccount = require('./serviceAccountKey.json');

const cert = admin.credential ? admin.credential.cert(serviceAccount) : admin.cert(serviceAccount);

admin.initializeApp({
  credential: cert
});

const app = express();
app.use(cors());
app.use(express.json());

// Guardaremos los celulares registrados y el tiempo del último toque
let deviceTokens = new Set();
let lastRingTimestamp = 0;

const COOLDOWN_MS = 60 * 1000; // 1 minuto entre toques
const HOME_COORDS = { lat: -32.9468, lng: -60.6393 }; // Reemplazar por tus coordenadas
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

// RUTA 1: Registrar celulares (Tu celular y el de tu novio)
app.post('/api/register-device', (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ error: 'Token de dispositivo requerido' });

  deviceTokens.add(fcmToken);
  console.log(`📱 Dispositivo registrado con éxito. Total: ${deviceTokens.size}`);
  return res.json({ success: true, message: 'Dispositivo registrado correctamente' });
});

// RUTA 2: Tocar el timbre (Visitante)
app.post('/api/ring-bell', async (req, res) => {
  const { lat, lng } = req.body;
  const now = Date.now();

  // Anti-Spam
  if (now - lastRingTimestamp < COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastRingTimestamp)) / 1000);
    return res.status(429).json({ 
      error: `El timbre ya fue tocado. Por favor aguardá ${remainingSeconds} segundos.` 
    });
  }

  // Validación de distancia (opcional)
  if (lat && lng) {
    const distance = getDistanceInMeters(lat, lng, HOME_COORDS.lat, HOME_COORDS.lng);
    if (distance > MAX_DISTANCE_METERS) {
      return res.status(403).json({ error: 'Estás demasiado lejos de la vivienda para tocar el timbre.' });
    }
  }

  // Enviar notificación PUSH real a través de Firebase Cloud Messaging
  const tokens = Array.from(deviceTokens);
  
  if (tokens.length > 0) {
    const message = {
      notification: {
        title: '🔔 ¡Están tocando el timbre!',
        body: 'Hay alguien en la puerta de entrada.',
      },
      android: {
        priority: 'high',
        notification: { sound: 'default' }
      },
      tokens: tokens
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`🔔 Notificación enviada con éxito a ${response.successCount} dispositivos.`);
    } catch (error) {
      console.error('Error enviando notificación via Firebase:', error);
    }
  } else {
    console.log('🔔 Timbre tocado (sin dispositivos registrados aún).');
  }

  lastRingTimestamp = now;
  return res.json({ 
    success: true, 
    message: '¡El timbre está sonando! En breve te atienden.' 
  });
});

app.get('/', (req, res) => {
  res.send('Servidor del Timbre QR activo 🔔');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});