import React, { useState, useEffect } from 'react';
import { messaging, getToken } from '../firebase';

const API_BASE_URL = 'https://timbre-qr-35zh.onrender.com';

export default function Admin() {
  // Estado de Autenticación
  const [token, setToken] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Estado de Configuración Dinámica
  const [config, setConfig] = useState({
    isMuted: false,
    cooldownSeconds: 60,
    maxDistanceMeters: 50,
    customMessage: '🔔 ¡Atención! Hay alguien tocando el timbre en la puerta.'
  });
  const [configStatus, setConfigStatus] = useState({ loading: false, msg: '', type: '' });

  // Estado para Notificaciones Push (Firebase)
  const [pushStatus, setPushStatus] = useState('idle');
  const [pushMessage, setPushMessage] = useState('');

  // Estado para Guardar Teléfono
  const [phone, setPhone] = useState('');
  const [phoneStatus, setPhoneStatus] = useState('idle');
  const [phoneMessage, setPhoneMessage] = useState('');

  // Validar si ya hay token al cargar el componente
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      fetchConfig(savedToken);
    }
  }, []);

  // 0. Login de Administrador
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Contraseña incorrecta');

      setToken(data.token);
      localStorage.setItem('admin_token', data.token);
      setIsAuthenticated(true);
      fetchConfig(data.token);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Traer Configuración del Backend
  const fetchConfig = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/config`, {
        headers: { 'x-admin-token': authToken }
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      if (data.config) setConfig(data.config);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error al obtener configuración:', err);
    }
  };

  // Guardar Cambios de Configuración (Mute, Cooldown, Distancia)
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigStatus({ loading: true, msg: '', type: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al guardar');

      setConfig(data.config);
      setConfigStatus({ loading: false, msg: '✅ ¡Configuración actualizada!', type: 'success' });
    } catch (err) {
      setConfigStatus({ loading: false, msg: err.message, type: 'error' });
    }
  };

  // 1. Registrar Notificaciones Push en Firebase
  const registerDevice = async () => {
    setPushStatus('loading');
    setPushMessage('Solicitando permisos de notificación...');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Permiso de notificaciones denegado.');

      const fcmToken = await getToken(messaging, { 
        vapidKey: 'BKc_XF5_8xb9JRIUjX9cXmsbdrTbXj6GilaR4OvxfjLa4EYnlIK-nKR5GGlj1vqUCwdSjmdtyxCAhS-5sIxWgmM' 
      });

      if (!fcmToken) throw new Error('No se pudo generar el token FCM.');

      const response = await fetch(`${API_BASE_URL}/api/register-device`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ fcmToken })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al registrar el celular');

      setPushStatus('success');
      setPushMessage('✅ ¡Celular registrado para avisos Push!');
    } catch (err) {
      setPushStatus('error');
      setPushMessage(err.message);
    }
  };

  // 2. Guardar Número de Teléfono
  const handleSavePhone = async (e) => {
    e.preventDefault();
    setPhoneStatus('loading');
    setPhoneMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/phone`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al guardar el teléfono');

      setPhoneStatus('success');
      setPhoneMessage('✅ ¡Teléfono guardado con éxito!');
    } catch (err) {
      setPhoneStatus('error');
      setPhoneMessage(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    setIsAuthenticated(false);
  };

  // VISTA 1: Pantalla de Login si no está autenticado
  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🔒 Acceso Administrador</h1>
          <p style={styles.subtitle}>Ingresá la clave del panel de control</p>
          <form onSubmit={handleLogin}>
            <input 
              type="password"
              placeholder="Contraseña de Admin"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={styles.input}
              required
            />
            {authError && <div style={{ ...styles.alert, color: '#EF4444' }}>{authError}</div>}
            <button type="submit" style={{ ...styles.button, backgroundColor: '#2563EB', marginTop: '12px' }}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA 2: Panel de Administración
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>⚙️ Control del Timbre</h1>
          <button onClick={handleLogout} style={styles.logoutBtn}>Salir</button>
        </div>
        <p style={styles.subtitle}>Administrá las notificaciones y parámetros generales</p>

        {/* SECCIÓN 1: AJUSTES GENERALES DEL TIMBRE */}
        <form onSubmit={handleSaveConfig} style={styles.section}>
          <h3 style={styles.sectionTitle}>1. Configuración de Parámetros</h3>
          
          <div style={styles.switchRow}>
            <label style={styles.label}>Modo Silencioso (Mute):</label>
            <input 
              type="checkbox"
              checked={config.isMuted}
              onChange={(e) => setConfig({ ...config, isMuted: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={styles.label}>Espera entre toques (segundos):</label>
            <input 
              type="number"
              value={config.cooldownSeconds}
              onChange={(e) => setConfig({ ...config, cooldownSeconds: e.target.value })}
              style={styles.input}
              min="5"
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={styles.label}>Radio GPS Máximo (metros):</label>
            <input 
              type="number"
              value={config.maxDistanceMeters}
              onChange={(e) => setConfig({ ...config, maxDistanceMeters: e.target.value })}
              style={styles.input}
              min="10"
            />
          </div>

          <button 
            type="submit" 
            disabled={configStatus.loading}
            style={{ ...styles.button, backgroundColor: '#3B82F6' }}
          >
            {configStatus.loading ? 'Guardando...' : '💾 Guardar Parámetros'}
          </button>

          {configStatus.msg && (
            <div style={{ ...styles.alert, color: configStatus.type === 'error' ? '#EF4444' : '#10B981' }}>
              {configStatus.msg}
            </div>
          )}
        </form>

        <hr style={styles.divider} />

        {/* SECCIÓN 2: ACTIVAR NOTIFICACIONES EN EL CELULAR */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>2. Alertas Push (Firebase)</h3>
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
            <div style={{ ...styles.alert, color: pushStatus === 'error' ? '#EF4444' : '#10B981' }}>
              {pushMessage}
            </div>
          )}
        </div>

        <hr style={styles.divider} />

        {/* SECCIÓN 3: REGISTRAR NÚMERO DE TELÉFONO */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>3. Registrar Número de Teléfono</h3>
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
            <div style={{ ...styles.alert, color: phoneStatus === 'error' ? '#EF4444' : '#10B981' }}>
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
    justifyContent: 'center',
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
    maxWidth: '420px',
    width: '100%'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #EF4444',
    color: '#EF4444',
    padding: '4px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  title: { fontSize: '1.4rem', color: '#1F2937', marginBottom: '4px' },
  subtitle: { color: '#6B7280', fontSize: '0.85rem', marginBottom: '20px' },
  section: { textAlign: 'left' },
  sectionTitle: { fontSize: '0.95rem', fontWeight: 'bold', color: '#374151', marginBottom: '10px' },
  label: { fontSize: '0.85rem', color: '#4B5563', display: 'block', marginBottom: '4px' },
  switchRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '8px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '0.95rem',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer'
  },
  alert: { marginTop: '8px', fontSize: '0.85rem', fontWeight: '500', textAlign: 'center' },
  divider: { border: 'none', borderTop: '1px solid #E5E7EB', margin: '20px 0' }
};