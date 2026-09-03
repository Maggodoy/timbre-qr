import React, { useState } from 'react';
import { messaging, getToken } from './firebase';

export default function Admin() {
  // Estado para Notificaciones Push
  const [pushStatus, setPushStatus] = useState('idle');
  const [pushMessage, setPushMessage] = useState('');

  // Estado para Guardar Teléfono
  const [phone, setPhone] = useState('');
  const [phoneStatus, setPhoneStatus] = useState('idle');
  const [phoneMessage, setPhoneMessage] = useState('');

  // 1. Función para registrar Notificaciones Push en Firebase
  const registerDevice = async () => {
    setPushStatus('loading');
    setPushMessage('Solicitando permisos de notificación...');

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Permiso de notificaciones denegado.');
      }

      const fcmToken = await getToken(messaging, { 
        vapidKey: 'BKc_XF5_8xb9JRIUjX9cXmsbdrTbXj6GilaR4OvxfjLa4EYnlIK-nKR5GGlj1vqUCwdSjmdtyxCAhS-5sIxWgmM' 
      });

      if (!fcmToken) {
        throw new Error('No se pudo generar el token de notificaciones.');
      }

      const response = await fetch('https://timbre-qr-35zh.onrender.com/api/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar el celular');
      }

      setPushStatus('success');
      setPushMessage('✅ ¡Celular registrado! Ya vas a recibir avisos en este dispositivo.');
    } catch (err) {
      setPushStatus('error');
      setPushMessage(err.message);
    }
  };

  // 2. Función para guardar el número de teléfono en el backend
  const handleSavePhone = async (e) => {
    e.preventDefault();
    setPhoneStatus('loading');
    setPhoneMessage('');

    try {
      const response = await fetch('https://timbre-qr-35zh.onrender.com/api/admin/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar el teléfono');
      }

      setPhoneStatus('success');
      setPhoneMessage('✅ ¡Teléfono guardado con éxito!');
    } catch (err) {
      setPhoneStatus('error');
      setPhoneMessage(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚙️ Configuración del Timbre</h1>
        <p style={styles.subtitle}>Administrá las notificaciones y accesos de la casa</p>

        {/* SECCIÓN 1: ACTIVAR NOTIFICACIONES EN EL CELULAR */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>1. Alertas en este equipo</h3>
          <button 
            onClick={registerDevice} 
            disabled={pushStatus === 'loading' || pushStatus === 'success'}
            style={{
              ...styles.button,
              backgroundColor: '#10B981',
              opacity: pushStatus === 'loading' ? 0.7 : 1
            }}
          >
            {pushStatus === 'loading' ? 'Procesando...' : pushStatus === 'success' ? '¡Dispositivo Listo!' : '📱 Activar Notificaciones Push'}
          </button>

          {pushMessage && (
            <div style={{
              ...styles.alert,
              color: pushStatus === 'error' ? '#EF4444' : '#10B981'
            }}>
              {pushMessage}
            </div>
          )}
        </div>

        <hr style={styles.divider} />

        {/* SECCIÓN 2: REGISTRAR NÚMERO DE TELÉFONO */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>2. Registrar Número de Teléfono</h3>
          <form onSubmit={handleSavePhone}>
            <input 
              type="tel" 
              placeholder="+54341xxxxxxx" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              required
            />
            <button 
              type="submit" 
              disabled={phoneStatus === 'loading'}
              style={{
                ...styles.button,
                backgroundColor: '#2563EB',
                opacity: phoneStatus === 'loading' ? 0.7 : 1
              }}
            >
              {phoneStatus === 'loading' ? 'Guardando...' : '💾 Guardar Teléfono'}
            </button>
          </form>

          {phoneMessage && (
            <div style={{
              ...styles.alert,
              color: phoneStatus === 'error' ? '#EF4444' : '#10B981'
            }}>
              {phoneMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justify: 'center',
    minHeight: '100vh',
    backgroundColor: '#F3F4F6',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '32px 24px',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  title: { fontSize: '1.4rem', color: '#1F2937', marginBottom: '4px' },
  subtitle: { color: '#6B7280', fontSize: '0.9rem', marginBottom: '24px' },
  section: { textAlign: 'left' },
  sectionTitle: { fontSize: '1rem', color: '#374151', marginBottom: '12px' },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '1rem',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer'
  },
  alert: { marginTop: '12px', fontSize: '0.85rem', fontWeight: '500', textAlign: 'center' },
  divider: { border: 'none', borderTop: '1px solid #E5E7EB', margin: '24px 0' }
};