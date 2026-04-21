export default function Login({ onLogin, error }) {
    return (
        <div className="glass-card login-form animate-in" data-testid="login-container">
            <h1 data-testid="login-title">✨ QA System Login</h1>
            <form onSubmit={onLogin} data-testid="login-form">
                <div className="input-group">
                    <label className="input-label" htmlFor="login-user">Username</label>
                    <input 
                        id="login-user" 
                        data-testid="input-username"
                        className="input-field"
                        type="text" 
                        name="username" 
                        placeholder="Ingrese su usuario"
                        required 
                    />
                </div>
                <div className="input-group">
                    <label className="input-label" htmlFor="login-pass">Password</label>
                    <input 
                        id="login-pass" 
                        data-testid="input-password"
                        className="input-field"
                        type="password" 
                        name="password" 
                        placeholder="••••••••"
                        required 
                    />
                </div>
                <button 
                    id="btn-login" 
                    data-testid="button-login"
                    type="submit" 
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                >
                    Entrar al Sistema
                </button>
                {error && (
                    <p className="badge badge-red" id="login-error" data-testid="error-message" style={{ width: '100%', marginTop: '1rem', textAlign: 'center' }}>
                        {error}
                    </p>
                )}
            </form>
        </div>
    );
}