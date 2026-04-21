import { useState, useEffect } from 'react';

export default function AuditoriaView({ token, apiUrl }) {
    const [movements, setMovements] = useState([]);
    const [filter, setFilter] = useState('');

    const fetchAllMovements = async () => {
        const res = await fetch(`${apiUrl}/movements`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setMovements(await res.json());
    };

    useEffect(() => { fetchAllMovements(); }, []);

    const filtered = movements.filter(m => 
        m.product_name?.toLowerCase().includes(filter.toLowerCase()) ||
        m.username?.toLowerCase().includes(filter.toLowerCase()) ||
        m.movement_type?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="animate-in" data-testid="auditoria-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 data-testid="auditoria-title">🔍 Panel de Auditoría</h3>
                <input 
                    data-testid="input-filter-auditoria"
                    type="text" 
                    className="input-field" 
                    style={{ maxWidth: '300px' }}
                    placeholder="Filtrar por producto, usuario o tipo..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <div className="table-container">
                <table data-testid="auditoria-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>Acción</th>
                            <th>Cantidad</th>
                            <th>Responsable</th>
                            <th>Justificación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...filtered].reverse().map(m => (
                            <tr key={m.id} data-testid={`audit-row-${m.id}`}>
                                <td style={{ fontSize: '0.85rem' }}>{new Date(m.date).toLocaleString()}</td>
                                <td><strong>{m.product_name}</strong></td>
                                <td>
                                    <span className={`badge ${
                                        m.movement_type === 'ENTRADA' ? 'badge-green' : 
                                        m.movement_type === 'VENTA' ? 'badge-blue' : 
                                        m.movement_type === 'ELIMINACION' ? 'badge-red' : 'badge-orange'
                                    }`}>
                                        {m.movement_type}
                                    </span>
                                </td>
                                <td>{m.quantity}</td>
                                <td><span className="badge badge-blue" style={{background: '#f1f5f9'}}>{m.username}</span></td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                                    {m.justification}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
