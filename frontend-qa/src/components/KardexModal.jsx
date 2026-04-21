export default function KardexModal({ movements, onClose }) {
    if (!movements) return null;

    return (
        <div className="overlay" data-testid="kardex-overlay">
            <div className="modal animate-in" style={{ maxWidth: '800px' }} data-testid="kardex-modal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>📜 Historial: {movements.name}</h3>
                    <button className="btn btn-danger" onClick={onClose} data-testid="btn-close-kardex">✕</button>
                </div>

                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table id="kardex-table" data-testid="kardex-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Acción</th>
                                <th>Cant.</th>
                                <th>Responsable</th>
                                <th>Justificación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.data.length === 0 ? 
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No hay movimientos registrados.</td></tr> :
                                [...movements.data].reverse().map(m => (
                                    <tr key={m.id} data-testid={`kardex-row-${m.id}`}>
                                        <td style={{ fontSize: '0.8rem' }}>{new Date(m.date).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${m.movement_type === 'ENTRADA' ? 'badge-green' : m.movement_type === 'VENTA' ? 'badge-blue' : 'badge-red'}`}>
                                                {m.movement_type}
                                            </span>
                                        </td>
                                        <td><strong>{m.quantity}</strong></td>
                                        <td data-testid={`kardex-user-${m.id}`}>{m.username || `#${m.user_id}`}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.justification}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}