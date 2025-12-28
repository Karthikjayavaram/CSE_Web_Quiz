import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, ShieldCheck } from 'lucide-react';
import './Login.css'; // Utilizing existing glassmorphism styles

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAdminLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/admin/authenticate', { username, password });
            sessionStorage.setItem('adminToken', response.data.token);
            navigate('/admin');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card glass" style={{ maxWidth: '400px' }}>
                <div className="header">
                    <ShieldCheck size={48} className="icon" style={{ color: '#60a5fa' }} />
                    <h1>Admin Access</h1>
                    <p>Restricted Area. Authorized Personnel Only.</p>
                </div>

                <form onSubmit={handleAdminLogin}>
                    <div className="student-input-group">
                        <div className="input-field">
                            <User size={18} className="field-icon" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                required
                            />
                        </div>
                        <div className="input-field" style={{ marginTop: '1rem' }}>
                            <Lock size={18} className="field-icon" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                            />
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
