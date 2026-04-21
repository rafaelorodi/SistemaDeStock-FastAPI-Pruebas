import { useState, useEffect } from 'react';
import KardexModal from './KardexModal';

export default function AdminProductos({ token, apiUrl, role }) {
    const [products, setProducts] = useState([]);
    const [movements, setMovements] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null); // Para editar o ajustar stock
    const [actionType, setActionType] = useState(null); // 'edit', 'add_stock', 'remove_stock', 'delete'
    const [justification, setJustification] = useState('');
    const [amount, setAmount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todas');

    const fetchProducts = async () => {
        const res = await fetch(`${apiUrl}/products`);
        if (res.ok) setProducts(await res.json());
    };

    useEffect(() => { fetchProducts(); }, []);

    const categories = ['Todas', ...new Set(products.map(p => p.category))];

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Todas' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const executeAction = async () => {
        if (!justification && actionType !== 'add_stock') {
            alert("La justificación es obligatoria para esta acción");
            return;
        }

        let url = `${apiUrl}/products/${selectedProduct.id}`;
        let method = 'PUT';
        let body = {};

        if (actionType === 'add_stock') {
            url += '/add_stock';
            method = 'POST';
            body = { cantidad: parseInt(amount), justification: justification || 'Aumento de stock' };
        } else if (actionType === 'remove_stock') {
            url += '/remove_stock';
            method = 'POST';
            body = { cantidad: parseInt(amount), justification };
        } else if (actionType === 'delete') {
            url += `?justification=${encodeURIComponent(justification)}`;
            method = 'DELETE';
            body = null;
        }

        const res = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: body ? JSON.stringify(body) : null
        });

        if (res.ok) {
            closeModal();
            fetchProducts();
        } else {
            const err = await res.json();
            alert(`Error: ${err.detail}`);
        }
    };

    const closeModal = () => {
        setSelectedProduct(null);
        setActionType(null);
        setJustification('');
        setAmount(0);
    };

    return (
        <div className="animate-in" data-testid="admin-productos-container">
            <div className="dashboard-header">
                <h3 data-testid="title-productos">Gestión de Inventario</h3>
                <button 
                    data-testid="btn-new-product"
                    className="btn btn-primary" 
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cerrar' : '📦 Nuevo Producto'}
                </button>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                    data-testid="admin-search"
                    className="input-field"
                    placeholder="🔍 Buscar en inventario..."
                    style={{ flex: 1, minWidth: '200px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="category-scroll" data-testid="admin-categories">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {showForm && (
                <div className="glass-card" style={{ marginBottom: '2rem' }} data-testid="form-product">
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const data = {
                            name: e.target.name.value,
                            category: e.target.category.value,
                            description: e.target.description.value,
                            price: parseFloat(e.target.price.value),
                            stock: parseInt(e.target.stock.value)
                        };
                        const res = await fetch(`${apiUrl}/products`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify(data)
                        });
                        if (res.ok) { fetchProducts(); setShowForm(false); }
                    }} className="grid-2">
                        <div className="input-group">
                            <label className="input-label">Nombre</label>
                            <input name="name" className="input-field" data-testid="input-prod-name" required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Categoría</label>
                            <input name="category" className="input-field" data-testid="input-prod-category" required />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label className="input-label">Descripción</label>
                            <textarea name="description" className="input-field" data-testid="input-prod-desc" rows="2" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Precio ($)</label>
                            <input name="price" type="number" step="0.01" className="input-field" data-testid="input-prod-price" required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Stock Inicial</label>
                            <input name="stock" type="number" className="input-field" data-testid="input-prod-stock" defaultValue="0" required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }} data-testid="btn-save-product">
                            Guardar Producto en Depósito
                        </button>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table data-testid="products-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => (
                            <tr key={p.id} data-testid={`product-row-${p.id}`}>
                                <td><strong>{p.name}</strong></td>
                                <td style={{ 
                                    fontSize: '0.875rem', 
                                    color: 'var(--text-muted)',
                                    maxWidth: '250px'
                                }}>
                                    {p.description || "—"}
                                </td>
                                <td><span className="badge badge-blue">{p.category}</span></td>
                                <td>${p.price}</td>
                                <td>
                                    <span data-testid={`stock-value-${p.id}`} className={`badge ${p.stock < 10 ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '1rem' }}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            data-testid={`btn-add-stock-${p.id}`}
                                            className="btn" style={{ padding: '0.5rem', background: '#ecfdf5', color: '#059669' }} 
                                            onClick={() => { setSelectedProduct(p); setActionType('add_stock'); }}
                                        >
                                            ➕
                                        </button>
                                        <button 
                                            data-testid={`btn-remove-stock-${p.id}`}
                                            className="btn" style={{ padding: '0.5rem', background: '#fff7ed', color: '#d97706' }} 
                                            onClick={() => { setSelectedProduct(p); setActionType('remove_stock'); }}
                                        >
                                            ➖
                                        </button>
                                        <button 
                                            data-testid={`btn-history-${p.id}`}
                                            className="btn" style={{ padding: '0.5rem', background: '#f8fafc', color: '#64748b' }} 
                                            onClick={async () => {
                                                const res = await fetch(`${apiUrl}/products/${p.id}/movements`, { headers: { 'Authorization': `Bearer ${token}` } });
                                                if (res.ok) setMovements({ name: p.name, data: await res.json() });
                                            }}
                                        >
                                            📜
                                        </button>
                                        <button 
                                            data-testid={`btn-delete-prod-${p.id}`}
                                            className="btn" style={{ padding: '0.5rem', background: '#fef2f2', color: '#dc2626' }} 
                                            onClick={() => { setSelectedProduct(p); setActionType('delete'); }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE ACCIÓN CON JUSTIFICACIÓN */}
            {selectedProduct && (
                <div className="overlay" data-testid="modal-justification">
                    <div className="modal animate-in">
                        <h3>{actionType === 'add_stock' ? 'Aumentar Stock' : actionType === 'remove_stock' ? 'Disminuir Stock' : 'Eliminar Producto'}</h3>
                        <p>Producto: <strong>{selectedProduct.name}</strong></p>
                        
                        {(actionType === 'add_stock' || actionType === 'remove_stock') && (
                            <div className="input-group">
                                <label className="input-label">Cantidad</label>
                                <input 
                                    type="number" 
                                    className="input-field" 
                                    data-testid="input-modal-amount"
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)} 
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Justificación {actionType !== 'add_stock' && '(Obligatoria)'}</label>
                            <textarea 
                                className="input-field" 
                                data-testid="input-modal-justification"
                                placeholder="Escriba el motivo de esta acción..."
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                required={actionType !== 'add_stock'}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={executeAction} data-testid="btn-modal-confirm">Confirmar</button>
                            <button className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }} onClick={closeModal} data-testid="btn-modal-cancel">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            <KardexModal movements={movements} onClose={() => setMovements(null)} />
        </div>
    );
}