import { FormEvent, useState } from 'react';
import axios from 'axios';
import { Users, Phone, User } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [credentials, setCredentials] = useState([
        { techziteId: '', phoneNumber: '' },
        { techziteId: '', phoneNumber: '' },
        { techziteId: '', phoneNumber: '' }
    ]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (index: number, field: string, value: string) => {
        const newCreds = [...credentials];
        (newCreds[index] as any)[field] = value;
        setCredentials(newCreds);
    };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/auth/group-login', { credentials });
            localStorage.setItem('quiz_token', response.data.token);
            localStorage.setItem('group_info', JSON.stringify(response.data.group));
            // Navigate to Rules page
            window.location.href = '/rules';
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card glass">
                <div className="header">
                    <Users size={48} className="icon" />
                    <h1>Group Login</h1>
                    <p>Enter TechZite ID and Phone Number for all 3 students</p>
                </div>

                <form onSubmit={handleLogin}>
                    {credentials.map((cred, index) => (
                        <div key={index} className="student-input-group">
                            <h3>Student {index + 1}</h3>
                            <div className="input-row">
                                <div className="input-field">
                                    <User size={18} className="field-icon" />
                                    <input
                                        type="text"
                                        placeholder="TechZite ID (e.g., TZ2024001)"
                                        value={cred.techziteId}
                                        onChange={(e) => handleChange(index, 'techziteId', e.target.value.toUpperCase())}
                                        required
                                    />
                                </div>
                                <div className="input-field">
                                    <Phone size={18} className="field-icon" />
                                    <input
                                        type="tel"
                                        placeholder="Phone Number (10 digits)"
                                        value={cred.phoneNumber}
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        onChange={(e) => handleChange(index, 'phoneNumber', e.target.value.replace(/\D/g, ''))}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Validating...' : 'Proceed to Rules'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
