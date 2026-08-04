import React, { useState } from 'react';
import Admin from './Admin';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [clicks, setClicks] = useState(0);

  // Al hacer clic 3 veces en el título, solicita PIN de seguridad
  const handleTitleClick = () => {
    const nextClicks = clicks + 1;
    setClicks(nextClicks);

    if (nextClicks === 3) {
      const pin = prompt('Ingresá el PIN de administración:');
      if (pin === '1234') { // Podés cambiar '1234' por tu clave preferida
        setIsAdmin(true);
      } else {
        alert('PIN incorrecto');
      }
      setClicks(0);
    }
  };

  if (isAdmin) {
    return <Admin />;
  }

  return <RingBellView onTitleClick={handleTitleClick} />;
}

function RingBellView({ onTitleClick }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const ringBell = async () => {
    setStatus('loading');
    setMessage('Haciendo sonar el timbre...');

    try {
      const response = await fetch('https://timbre-qr-35zh.onrender.com/api/ring-bell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Enviamos body vacío para evitar fallos en el servidor
      });

      // Validamos que la respuesta sea realmente un JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('El servidor se está iniciando o devolvió una respuesta no válida. Intentalo en unos segundos.');
      }

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
        {/* Hacer 3 clics seguidos en el título para abrir el modal del PIN */}
        <h1 style={styles.title} onClick={onTitleClick}>¡Hola! 👋</h1>
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
  title: { fontSize: '1.5rem', color: '#1F2937', marginBottom: '8px', cursor: 'pointer', userSelect: 'none' },
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