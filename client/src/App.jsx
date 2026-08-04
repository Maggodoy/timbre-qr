import React from 'react';
import Admin from './Admin';

export default function App() {
  // Si la URL termina en /admin, mostramos la pantalla de registro
  const isAdmin = window.location.pathname === '/admin';

  if (isAdmin) {
    return <Admin />;
  }

  // Por defecto, mostramos el botón de timbre para la visita
  return <RingBellView />;
}

function RingBellView() {
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');

  const ringBell = () => {
    setStatus('loading');
    setMessage('Obteniendo ubicación y avisando...');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendRingSignal(position.coords.latitude, position.coords.longitude);
        },
        () => sendRingSignal(null, null),
        { timeout: 5000 }
      );
    } else {
      sendRingSignal(null, null);
    }
  };

  const sendRingSignal = async (lat, lng) => {
    try {
      const response = await fetch('[https://timbre-qr-35zh.onrender.com/api/ring-bell](https://timbre-qr-35zh.onrender.com/api/ring-bell)', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error al tocar el timbre');
      }

      setStatus('success');
      setMessage(data.message);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>¡Hola! 👋</h1>
        <p style={styles.subtitle}>Presioná el botón para avisar que estás en la puerta</p>

        <button 
          onClick={ringBell} 
          disabled={status === 'loading' || status === 'success'}
          style={{
            ...styles.button,
            backgroundColor: status === 'success' ? '#10B981' : '#2563EB',
            opacity: status === 'loading' ? 0.7 : 1
          }}
        >
          {status === 'loading' ? 'Enviando...' : status === 'success' ? '¡Sonando!' : '🔔 Tocar Timbre'}
        </button>

        {message && (
          <div style={{
            ...styles.alert,
            color: status === 'error' ? '#EF4444' : '#10B981'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F3F4F6',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '40px 24px',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  title: { fontSize: '1.8rem', color: '#1F2937', marginBottom: '8px' },
  subtitle: { color: '#6B7280', fontSize: '1rem', marginBottom: '32px' },
  button: {
    width: '100%',
    padding: '18px',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#FFF',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out'
  },
  alert: { marginTop: '24px', fontSize: '0.95rem', fontWeight: '500' }
};