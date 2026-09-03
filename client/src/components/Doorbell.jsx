import React, { useState } from 'react';

// Cambiá esta URL por la de tu backend en Render
const API_BASE_URL = 'https://timbre-qr-35zh.onrender.com';

export default function Doorbell() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRing = () => {
    setLoading(true);
    setMessage('');
    setError('');

    // Pedir ubicación GPS al visitante
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          sendRingRequest(latitude, longitude);
        },
        () => {
          // Si el visitante rechaza el GPS, intentamos enviar sin coordenadas
          sendRingRequest(null, null);
        }
      );
    } else {
      sendRingRequest(null, null);
    }
  };

  const sendRingRequest = async (lat, lng) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ring-bell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo tocar el timbre');
      }

      setMessage(data.message || '🔔 ¡Timbre tocado! Ya le avisamos a la casa.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>¡Hola! 👋</h1>
        <p style={styles.subtitle}>Presioná el botón para avisar que estás en la puerta</p>

        <button 
          onClick={handleRing} 
          disabled={loading} 
          style={styles.button}
        >
          {loading ? 'Avisando...' : '🔔 Tocar Timbre'}
        </button>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '35px 25px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    textAlign: 'center',
    maxWidth: '380px',
    width: '100%'
  },
  title: { margin: '0 0 10px 0', fontSize: '1.8rem', color: '#1a1a1a' },
  subtitle: { color: '#666', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.4' },
  button: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '16px 28px',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
  },
  success: { color: '#16a34a', fontWeight: 'bold', marginTop: '20px', fontSize: '0.95rem' },
  error: { color: '#dc2626', fontWeight: 'bold', marginTop: '20px', fontSize: '0.95rem' }
};