import React, { useState } from 'react';
import { messaging, getToken } from './firebase';

export default function Admin() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const registerDevice = async () => {
    setStatus('loading');
    setMessage('Solicitando permisos de notificación...');

    try {
      // 1. Pedir permiso al usuario en el navegador
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Permiso de notificaciones denegado.');
      }

      // 2. Obtener Token de Firebase con tu clave VAPID
      const fcmToken = await getToken(messaging, { 
        vapidKey: 'BKc_XF5_8xb9JRIUjX9cXmsbdrTbXj6GilaR4OvxfjLa4EYnlIK-nKR5GGlj1vqUCwdSjmdtyxCAhS-5sIxWgmM' 
      });

      if (!fcmToken) {
        throw new Error('No se pudo generar el token de notificaciones.');
      }

      // 3. Registrar el token en el Backend
      const response = await fetch('http://localhost:3001/api/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar el celular');
      }

      setStatus('success');
      setMessage('✅ ¡Celular registrado con éxito! Ya vas a recibir las alertas cuando toquen el timbre.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚙️ Configuración del Timbre</h1>
        <p style={styles.subtitle}>Tocá el botón para activar los avisos en este celular</p>

        <button 
          onClick={registerDevice} 
          disabled={status === 'loading' || status === 'success'}
          style={{
            ...styles.button,
            backgroundColor: status === 'success' ? '#10B981' : '#10B981',
            opacity: status === 'loading' ? 0.7 : 1
          }}
        >
          {status === 'loading' ? 'Procesando...' : status === 'success' ? '¡Dispositivo Listo!' : '📱 Activar en este Celular'}
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
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  alert: { marginTop: '24px', fontSize: '0.9rem', fontWeight: '500' }
};