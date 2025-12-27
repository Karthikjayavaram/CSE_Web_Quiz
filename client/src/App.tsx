import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Rules from './pages/Rules';
import Quiz from './pages/Quiz';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route
                    path="/admin"
                    element={
                        localStorage.getItem('adminToken')
                            ? <AdminDashboard />
                            : <Navigate to="/admin/login" replace />
                    }
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
