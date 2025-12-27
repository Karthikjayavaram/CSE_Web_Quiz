import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Lock, User } from 'lucide-react';
import './Login.css'; // Reusing base login styles but adding admin specific overrides inline or class

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/admin/login', { username, password });
            localStorage.setItem('adminToken', response.data.token);
            navigate('/admin');
        } catch (err: any) {
            console.error('Login Error:', err);
            const msg = err.response?.data?.message || err.message;
            if (msg === 'Network Error') {
                setError('Connection failed. Please check CORS/Server status.');
            } else {
                setError(msg || 'Invalid credentials');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page admin-login-bg">
            <div className="login-card glass glass-dark">
                <div className="header">
                    <div className="icon-wrapper">
                        <ShieldCheck size={48} color="#f472b6" />
                    </div>
                    <h1>Admin Portal</h1>
                    <p>Secure Access Control</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-field-wrapper">
                        <label>Administrator ID</label>
                        <div className="input-field">
                            <User className="field-icon" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-field-wrapper">
                        <label>Password</label>
                        <div className="input-field">
                            <Lock className="field-icon" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-button admin-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Authenticating...' : 'Access Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
