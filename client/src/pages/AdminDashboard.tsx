import { FormEvent, useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../socket';
import { Upload, Activity, ShieldAlert, Trophy, Download } from 'lucide-react';
import './AdminDashboard.css';

interface Result {
    groupId: string;
    groupIdentifier: string;
    students: { name: string; id: string }[];
    score: number;
    totalQuestions: number;
    finishedAt: string;
}

interface HeavyViolator {
    groupId: string;
    students: string[];
    violationCount: number;
}

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('monitor');
    const [violations, setViolations] = useState<any[]>([]);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [status, setStatus] = useState('');
    const [results, setResults] = useState<Result[]>([]);
    const [heavyViolators, setHeavyViolators] = useState<HeavyViolator[]>([]);

    useEffect(() => {
        console.log('AdminDashboard: Connecting socket...');
        socket.connect();

        socket.on('connect', () => {
            console.log('AdminDashboard: Socket connected!', socket.id);
        });

        socket.on('admin-violation-alert', (data: any) => {
            console.log('AdminDashboard: Received violation alert!', data);
            setViolations((prev) => {
                const updated = [data, ...prev];
                console.log('Updated violations list:', updated);
                return updated;
            });
        });

        socket.on('disconnect', () => {
            console.log('AdminDashboard: Socket disconnected');
        });

        return () => {
            socket.off('connect');
            socket.off('admin-violation-alert');
            socket.off('disconnect');
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'results') {
            fetchResults();
        } else if (activeTab === 'violators') {
            fetchHeavyViolators();
        }
    }, [activeTab]);

    const fetchResults = async () => {
        try {
            const response = await axios.get('/api/quiz/results');
            console.log('Fetched results:', response.data);
            setResults(response.data);
        } catch (error) {
            console.error('Failed to fetch results:', error);
        }
    };

    const fetchHeavyViolators = async () => {
        try {
            const response = await axios.get('/api/admin/heavy-violators');
            console.log('Fetched heavy violators:', response.data);
            setHeavyViolators(response.data);
        } catch (error) {
            console.error('Failed to fetch heavy violators:', error);
        }
    };

    const handleFileUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;

        const formData = new FormData();
        formData.append('file', uploadFile);

        try {
            setStatus('Uploading...');
            await axios.post('/api/admin/upload-students', formData);
            setStatus('Students uploaded successfully!');
            setTimeout(() => setStatus(''), 3000);
        } catch (err: any) {
            setStatus('Upload failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleApprove = async (groupId: string) => {
        try {
            console.log('Unlocking group:', groupId);
            await axios.post('/api/admin/unlock-group', { groupId });
            setViolations((prev) => prev.filter(v => v.groupId !== groupId));
            // No alert - silent operation
        } catch (err) {
            console.error('Failed to unlock group:', err);
        }
    };

    const exportToExcel = () => {
        const headers = ['Rank', 'Students', 'Score', 'Percentage'];
        const rows = results.map((r, idx) => [
            idx + 1,
            r.students.map(s => s.name).join(' | '),
            `${r.score}/${r.totalQuestions || 20}`,
            `${((r.score / (r.totalQuestions || 20)) * 100).toFixed(1)}%`
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="admin-dashboard">
            <aside className="sidebar glass">
                <div className="logo">Admin Quiz Panel</div>
                <nav>
                    <button className={activeTab === 'monitor' ? 'active' : ''} onClick={() => setActiveTab('monitor')}>
                        <Activity size={20} /> Live Monitoring
                    </button>
                    <button className={activeTab === 'violators' ? 'active' : ''} onClick={() => setActiveTab('violators')}>
                        <ShieldAlert size={20} /> Heavy Violators
                    </button>
                    <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>
                        <Upload size={20} /> Manage Students
                    </button>
                    <button className={activeTab === 'results' ? 'active' : ''} onClick={() => setActiveTab('results')}>
                        <Trophy size={20} /> Quiz Results
                    </button>
                </nav>
            </aside>

            <main className="content">
                {activeTab === 'monitor' && (
                    <div className="section">
                        <h1>Live Violation Feed</h1>
                        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                            Socket Status: {socket.connected ? '🟢 Connected' : '🔴 Disconnected'} |
                            Violations Logged: {violations.length}
                        </p>
                        <div className="violation-list">
                            {violations.length === 0 ? (
                                <p className="empty">No violations detected yet. Violations will appear here in real-time.</p>
                            ) : (
                                violations.map((v, i) => (
                                    <div key={i} className="violation-card glass">
                                        <ShieldAlert color="#f87171" size={32} />
                                        <div className="details">
                                            <h3>{v.type}</h3>
                                            <p><strong>Students:</strong> {v.studentNames?.join(', ') || 'Unknown'}</p>
                                            <small>{new Date(v.timestamp).toLocaleString()}</small>
                                        </div>
                                        <div className="actions">
                                            <button className="approve" onClick={() => handleApprove(v.groupId)}>
                                                ✓ Unlock & Resume
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'violators' && (
                    <div className="section">
                        <h1>Heavy Violators (&gt;2 Violations)</h1>
                        {heavyViolators.length === 0 ? (
                            <p className="empty">No groups have exceeded 2 violations.</p>
                        ) : (
                            <div className="violators-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Students</th>
                                            <th>Total Violations</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {heavyViolators.map((hv) => (
                                            <tr key={hv.groupId}>
                                                <td>{hv.students.join(', ')}</td>
                                                <td className="violation-count-cell">{hv.violationCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="section">
                        <h1>Student Management</h1>
                        <div className="upload-box glass">
                            <h3>Upload Student Excel Sheet</h3>
                            <p><strong>Required columns:</strong> techziteId | name | email | phoneNumber</p>
                            <p className="info-text">⚠️ Uploading will replace ALL existing students</p>
                            <form onSubmit={handleFileUpload}>
                                <input type="file" onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)} accept=".xlsx, .xls" />
                                <button type="submit" className="upload-btn">Upload Students</button>
                            </form>
                            {status && <p className="status-msg">{status}</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="section">
                        <div className="results-header">
                            <h1>Quiz Results</h1>
                            {results.length > 0 && (
                                <button className="export-btn" onClick={exportToExcel}>
                                    <Download size={18} /> Export to CSV
                                </button>
                            )}
                        </div>

                        {results.length === 0 ? (
                            <p className="empty">No results yet. Groups will appear here after completing the quiz.</p>
                        ) : (
                            <div className="results-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Students</th>
                                            <th>Score</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((result, idx) => (
                                            <tr key={result.groupId}>
                                                <td className="rank">#{idx + 1}</td>
                                                <td>{result.students.map(s => s.name).join(', ')}</td>
                                                <td className="score">{result.score}/{result.totalQuestions || 20}</td>
                                                <td>{((result.score / (result.totalQuestions || 20)) * 100).toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
