import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Rules from './pages/Rules';
import Quiz from './pages/Quiz';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import './App.css';

const ProtectedAdminRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        return <Navigate to="/admin-login" replace />;
    }
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route
                    path="/admin"
                    element={
                        <ProtectedAdminRoute>
                            <AdminDashboard />
                        </ProtectedAdminRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
