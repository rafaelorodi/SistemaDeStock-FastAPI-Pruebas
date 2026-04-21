import { useState, useEffect } from 'react';

export default function AdminUsuarios({ token, apiUrl, onUnauthorized }) {
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', rol: 'vendedor' });

    const fetchUsers = async () => {
        const res = await fetch(`${apiUrl}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) return onUnauthorized();
        if (res.ok) setUsers(await res.json());
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch(`${apiUrl}/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            setFormData({ username: '', password: '', rol: 'vendedor' });
            setShowForm(false);
            fetchUsers();
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("¿Seguro que desea eliminar este usuario?")) return;
        await fetch(`${apiUrl}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchUsers();
    };

    return (
        <div className="animate-in" data-testid="admin-usuarios-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 data-testid="title-usuarios">Gestión de Usuarios</h3>
                <button 
                    data-testid="btn-toggle-user-form"
                    className="btn btn-primary" 
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancelar' : '➕ Nuevo Usuario'}
                </button>
            </div>

            {showForm && (
                <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }} data-testid="form-new-user">
                    <form onSubmit={handleSubmit} className="grid-2">
                        <div className="input-group">
                            <label className="input-label">Usuario</label>
                            <input 
                                data-testid="input-new-username"
                                className="input-field"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Contraseña</label>
                            <input 
                                data-testid="input-new-password"
                                className="input-field"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Rol del Sistema</label>
                            <select 
                                data-testid="select-new-rol"
                                className="input-field"
                                value={formData.rol}
                                onChange={(e) => setFormData({...formData, rol: e.target.value})}
                            >
                                <option value="admin_usuarios">ADMIN USUARIOS</option>
                                <option value="encargado_deposito">ENCARGADO DEPÓSITO</option>
                                <option value="vendedor">VENDEDOR</option>
                                <option value="auditoria">AUDITORÍA</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button data-testid="btn-save-user" type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Guardar Usuario
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table id="users-table" data-testid="users-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} data-testid={`user-row-${u.username}`}>
                                <td><strong>{u.username}</strong></td>
                                <td>
                                    <span data-testid={`badge-rol-${u.username}`} className={`badge ${u.rol === 'admin_usuarios' ? 'badge-blue' : 'badge-orange'}`}>
                                        {u.rol.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                                        {u.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        data-testid={`btn-delete-${u.username}`}
                                        className="btn btn-danger" 
                                        onClick={() => deleteUser(u.id)}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}