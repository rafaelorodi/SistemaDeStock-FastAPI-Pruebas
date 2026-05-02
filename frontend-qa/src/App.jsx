import { useState, useCallback } from 'react';
import Login from './components/Login';
import AdminUsuarios from './components/AdminUsuarios';
import AdminProductos from './components/AdminProductos';
import VendedorView from './components/VendedorView';
import AuditoriaView from './components/AuditoriaView';
import './App.css';

// Ahora Nginx maneja las rutas, por lo que usamos una ruta relativa
const API_URL = "/api";

const parseJwt = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [role, setRole] = useState(localStorage.getItem('user_role'));
  const [error, setError] = useState('');

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setToken(null);
    setRole(null);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const formData = new URLSearchParams();
    formData.append('username', e.target.username.value);
    formData.append('password', e.target.password.value);

    try {
      const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const decodedToken = parseJwt(data.access_token);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_role', decodedToken.rol);
        setToken(data.access_token);
        setRole(decodedToken.rol);
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Usuario o contraseña no válidos');
      }
    } catch (err) {
      setError('Error de conexión: Asegúrate de que el backend esté corriendo');
    }
  };

  const getDashboardTitle = () => {
    switch (role) {
      case 'admin_usuarios': return '👥 Gestión de Recursos Humanos';
      case 'encargado_deposito': return '📦 Control de Almacén y Stock';
      case 'vendedor': return '🛒 Terminal de Punto de Venta';
      case 'auditoria': return '🔍 Sistema de Auditoría Central';
      default: return 'Panel Principal';
    }
  };

  // Función para envolver peticiones y manejar errores 401 automáticamente
  const apiFetch = async (endpoint, options = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.status === 401) handleLogout();
    return res;
  };

  return (
    <div className="app-container" data-testid="main-app">
      {!token ? (
        <Login onLogin={handleLogin} error={error} />
      ) : (
        <div className="glass-card animate-in" data-testid="dashboard-view">
          <div className="dashboard-header">
            <h2 data-testid="dashboard-title">{getDashboardTitle()}</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className="badge badge-blue">{role?.toUpperCase()}</span>
              <button
                onClick={handleLogout}
                className="btn btn-danger"
                id="btn-logout"
                data-testid="logout-button"
              >
                Salir
              </button>
            </div>
          </div>

          <main data-testid="dashboard-content">
            {role === 'admin_usuarios' && <AdminUsuarios token={token} apiUrl={API_URL} onUnauthorized={handleLogout} />}
            {role === 'encargado_deposito' && <AdminProductos token={token} apiUrl={API_URL} role={role} onUnauthorized={handleLogout} />}
            {role === 'vendedor' && <VendedorView token={token} apiUrl={API_URL} onUnauthorized={handleLogout} />}
            {role === 'auditoria' && <AuditoriaView token={token} apiUrl={API_URL} onUnauthorized={handleLogout} />}
          </main>
        </div>
      )}
    </div>
  );
}