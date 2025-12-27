import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Rules from './pages/Rules';
import Quiz from './pages/Quiz';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
