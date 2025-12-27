import { FormEvent, useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../socket';
import { Upload, Activity, ShieldAlert, Trophy, Download, Database } from 'lucide-react';
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

    const [isConnected, setIsConnected] = useState(socket.connected);

    // Database Management
    const [selectedResource, setSelectedResource] = useState('students');
    const [resourcesData, setResourcesData] = useState<any[]>([]);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [jsonInput, setJsonInput] = useState('');

    useEffect(() => {
        console.log('AdminDashboard: Connecting socket...');
        socket.connect();

        function onConnect() {
            console.log('AdminDashboard: Socket connected!', socket.id);
            setIsConnected(true);
        }

        function onDisconnect() {
            console.log('AdminDashboard: Socket disconnected');
            setIsConnected(false);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);


        socket.on('admin-violation-alert', (data: any) => {
            console.log('AdminDashboard: Received violation alert!', data);
            setViolations((prev) => {
                const updated = [data, ...prev];
                console.log('Updated violations list:', updated);
                return updated;
            });
        });

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('admin-violation-alert');
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'results') {
            fetchResults();
        } else if (activeTab === 'violators') {
            fetchHeavyViolators();
        } else if (activeTab === 'database') {
            fetchResources();
        }
    }, [activeTab, selectedResource]);

    const fetchResources = async () => {
        try {
            const response = await axios.get(`/api/admin/resources/${selectedResource}`);
            setResourcesData(response.data);
        } catch (error) {
            console.error('Failed to fetch resources:', error);
        }
    };


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

    const handleDeleteResource = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await axios.delete(`/api/admin/resources/${selectedResource}/${id}`);
            fetchResources();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Delete failed');
        }
    };

    const handleSaveResource = async () => {
        try {
            const data = JSON.parse(jsonInput);
            if (editItem) {
                await axios.put(`/api/admin/resources/${selectedResource}/${editItem._id}`, data);
            } else {
                await axios.post(`/api/admin/resources/${selectedResource}`, data);
            }
            setEditItem(null);
            setIsCreating(false);
            fetchResources();
        } catch (error) {
            alert('Operation failed. Check JSON format or Server logs.\n' + error);
        }
    };

    const openEdit = (item: any) => {
        setEditItem(item);
        setJsonInput(JSON.stringify(item, null, 2));
        setIsCreating(false);
    };

    const openCreate = () => {
        setEditItem(null);
        setJsonInput('{\n  \n}');
        setIsCreating(true);
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
                    <button className={activeTab === 'database' ? 'active' : ''} onClick={() => setActiveTab('database')}>
                        <Database size={20} /> Database
                    </button>
                </nav>
            </aside>

            <main className="content">
                {activeTab === 'monitor' && (
                    <div className="section">
                        <h1>Live Violation Feed</h1>
                        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                            Socket Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'} |
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

                {activeTab === 'database' && (
                    <div className="section">
                        <h1>Database Management</h1>
                        <div className="controls glass" style={{ marginBottom: '1rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <label>Select Collection:</label>
                            <select
                                value={selectedResource}
                                onChange={(e) => setSelectedResource(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '4px', background: 'white', color: 'black' }}
                            >
                                <option value="students">Students</option>
                                <option value="groups">Groups</option>
                                <option value="quizzes">Quizzes</option>
                            </select>
                            <button className="approve" onClick={openCreate}>+ Add New JSON</button>
                        </div>

                        {(editItem || isCreating) && (
                            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                                <div className="modal glass" style={{ padding: '2rem', width: '600px', maxWidth: '90%', background: '#1e293b' }}>
                                    <h2>{isCreating ? 'Create New' : 'Edit Item'} ({selectedResource})</h2>
                                    <textarea
                                        value={jsonInput}
                                        onChange={e => setJsonInput(e.target.value)}
                                        rows={15}
                                        style={{ width: '100%', fontFamily: 'monospace', padding: '1rem', marginTop: '1rem', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }}
                                    />
                                    <div className="actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => { setEditItem(null); setIsCreating(false); }} className="reject" style={{ background: 'gray' }}>Cancel</button>
                                        <button onClick={handleSaveResource} className="approve">Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="table-container glass" style={{ padding: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '1rem' }}>ID</th>
                                        <th style={{ padding: '1rem' }}>Data Preview</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resourcesData.map((item: any) => (
                                        <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', opacity: 0.7, fontFamily: 'monospace' }}>{item._id}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.9 }}>
                                                    {item.name || item.groupId || item.title || JSON.stringify(item)}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => openEdit(item)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>Edit</button>
                                                <button onClick={() => handleDeleteResource(item._id)} style={{ padding: '0.5rem 1rem', background: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
