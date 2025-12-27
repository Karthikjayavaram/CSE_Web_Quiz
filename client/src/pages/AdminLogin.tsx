import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Reuse Login styles

const AdminLogin = () => {
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleAdminLogin = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/admin/authenticate', { username, password });
            localStorage.setItem('adminToken', response.data.token);
            navigate('/admin');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box glass">
                <h2>Admin Panel Login</h2>
                <form onSubmit={handleAdminLogin}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Admin Username"
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Secret Password"
                        />
                    </div>
                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit">Login to Dashboard</button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
