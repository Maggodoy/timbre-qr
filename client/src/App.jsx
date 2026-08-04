import React, { useState } from 'react';
import Admin from './Admin';

export default function App() {
  const [showAdmin, setShowAdmin] = useState(
    window.location.pathname === '/admin' || window.location.search.includes('admin')
  );

  return (
    <div>
      {/* Botón flotante para cambiar entre vistas rápidamente */}
      <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}>
        <button 
          onClick={() => setShowAdmin(!showAdmin)}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          {showAdmin ? 'Ver Timbre 🔔' : 'Ir a Configuración ⚙️'}
        </button>
      </div>

      {showAdmin ? <Admin /> : <RingBellView />}
    </div>
  );
}

function RingBellView() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const ringBell = async () => {
    setStatus('loading');
    setMessage('Haciendo sonar el timbre...');

    try {
      const response = await fetch('https://timbre-qr-35zh.onrender.com/api/ring-bell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al tocar el timbre');
      }

      setStatus('success');
      setMessage('🔔 ¡Timbre tocado! Ya le avisamos a la casa.');
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
          disabled={status === 'loading'}
          style={styles.button}
        >
          {status === 'loading' ? 'Avisando...' : '🔔 Tocar Timbre'}
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
  title: { fontSize: '1.5rem', color: '#1F2937', marginBottom: '8px' },
  subtitle: { color: '#6B7280', fontSize: '0.95rem', marginBottom: '32px' },
  button: {
    width: '100%',
    padding: '16px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#FFF',
    backgroundColor: '#2563EB',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  alert: { marginTop: '24px', fontSize: '0.9rem', fontWeight: '500' }
};