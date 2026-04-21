import { useState, useEffect } from 'react';

export default function VendedorView({ token, apiUrl }) {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [amount, setAmount] = useState(1);
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

    const handleSale = async () => {
        if (amount <= 0) return;
        const res = await fetch(`${apiUrl}/products/${selectedProduct.id}/sell`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ cantidad: parseInt(amount) })
        });

        if (res.ok) {
            setSelectedProduct(null);
            setAmount(1);
            fetchProducts();
        } else {
            const err = await res.json();
            alert(`Error: ${err.detail}`);
        }
    };

    return (
        <div className="animate-in" data-testid="vendedor-container">
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <input 
                        data-testid="vendedor-search"
                        className="input-field"
                        placeholder="🔍 Buscar producto..."
                        style={{ flex: 1 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="category-scroll" data-testid="vendedor-categories">
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
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '1.5rem' 
            }} data-testid="vendedor-grid">
                {filtered.map(p => (
                    <div 
                        key={p.id} 
                        className="glass-card" 
                        style={{ 
                            padding: '1.5rem', 
                            display: 'flex', 
                            flexDirection: 'column',
                            opacity: p.stock <= 0 ? 0.6 : 1,
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        onClick={() => p.stock > 0 && setSelectedProduct(p)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span className="badge badge-blue">{p.category}</span>
                            <span className={`badge ${p.stock < 10 ? 'badge-red' : 'badge-green'}`}>
                                {p.stock} disponibles
                            </span>
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{p.name}</h4>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1 }}>
                            {p.description}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                                ${p.price}
                            </span>
                            <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.5rem 1.25rem' }}
                                disabled={p.stock <= 0}
                            >
                                {p.stock <= 0 ? 'Sin Stock' : '🛒 Vender'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedProduct && (
                <div className="overlay" data-testid="sale-modal">
                    <div className="modal animate-in">
                        <h3>Confirmar Venta</h3>
                        <p>Producto: <strong>{selectedProduct.name}</strong></p>
                        <div className="input-group">
                            <label className="input-label">Cantidad a Vender</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                data-testid="input-sale-amount"
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                min="1"
                                max={selectedProduct.stock}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSale} data-testid="btn-confirm-sale">
                                Generar Venta
                            </button>
                            <button className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }} onClick={() => setSelectedProduct(null)} data-testid="btn-cancel-sale">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
