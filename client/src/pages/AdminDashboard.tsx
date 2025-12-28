import { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../socket';
import { Activity, ShieldAlert, Trophy, Download, Database, LogOut, Plus } from 'lucide-react';
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
    const [results, setResults] = useState<Result[]>([]);
    const [heavyViolators, setHeavyViolators] = useState<HeavyViolator[]>([]);

    const [isConnected, setIsConnected] = useState(socket.connected);

    // Database Management
    const [selectedResource, setSelectedResource] = useState('students');
    const [resourcesData, setResourcesData] = useState<any[]>([]);
    const [studentsList, setStudentsList] = useState<any[]>([]); // For Group selection
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');


    useEffect(() => {
        // Set up axios interceptor for admin token
        const interceptor = axios.interceptors.request.use((config) => {
            const token = localStorage.getItem('adminToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('adminToken');
                    window.location.href = '/admin/login';
                }
                return Promise.reject(error);
            }
        );


        console.log('AdminDashboard: Connecting socket...');



        if (!socket.connected) {
            socket.connect();
        }

        function onConnect() {
            console.log('AdminDashboard: Socket connected!', socket.id);
            setIsConnected(true);
        }

        function onDisconnect() {
            console.log('AdminDashboard: Socket disconnected');
            setIsConnected(false);
        }

        function onViolation(data: any) {
            console.log('AdminDashboard: Received violation alert!', data);
            setViolations((prev) => {
                const updated = [data, ...prev];
                return updated;
            });
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('admin-violation-alert', onViolation);

        // Initial check
        setIsConnected(socket.connected);

        return () => {
            axios.interceptors.request.eject(interceptor);
            axios.interceptors.response.eject(responseInterceptor);
            socket.off('connect', onConnect);

            socket.off('disconnect', onDisconnect);
            socket.off('admin-violation-alert', onViolation);
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
            if (selectedResource === 'groups') fetchStudentsList();
        }
    }, [activeTab, selectedResource]);

    const fetchStudentsList = async () => {
        try {
            const response = await axios.get('/api/admin/resources/students');
            setStudentsList(response.data);
        } catch (error) {
            console.error('Failed to fetch students list:', error);
        }
    };

    const filteredData = resourcesData.filter(item => {
        if (!searchTerm) return true;
        const lowSearch = searchTerm.toLowerCase();

        if (selectedResource === 'students') {
            return (
                item.name?.toLowerCase().includes(lowSearch) ||
                item.techziteId?.toLowerCase().includes(lowSearch) ||
                item.phoneNumber?.includes(lowSearch) ||
                item.email?.toLowerCase().includes(lowSearch)
            );
        } else if (selectedResource === 'groups') {
            return (
                item.groupId?.toLowerCase().includes(lowSearch) ||
                item.students?.some((s: any) =>
                    (s.name || s).toLowerCase().includes(lowSearch) ||
                    (s.techziteId || '').toLowerCase().includes(lowSearch)
                )
            );
        } else if (selectedResource === 'quizzes') {
            return item.title?.toLowerCase().includes(lowSearch);
        }
        return true;
    });


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

    const logout = () => {
        localStorage.removeItem('adminToken');
        window.location.reload();
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
            let data = { ...editItem };

            if (selectedResource === 'students') {
                if (!data.email || data.email.trim() === '') {
                    data.email = null;
                }
            } else if (selectedResource === 'groups') {
                if (data.studentSelections) {
                    data.students = data.studentSelections.filter((id: string) => id !== '');
                    delete data.studentSelections;
                }
            }

            if (!isCreating && editItem && editItem._id) {
                await axios.put(`/api/admin/resources/${selectedResource}/${editItem._id}`, data);
            } else {
                await axios.post(`/api/admin/resources/${selectedResource}`, data);
            }
            setEditItem(null);
            setIsCreating(false);
            fetchResources();
        } catch (error) {
            alert('Operation failed. Check data format or Server logs.\n' + error);
        }
    };


    const openEdit = (item: any) => {
        if (selectedResource === 'groups') {
            const studentIds = item.students?.map((s: any) => s._id || s) || [];
            setEditItem({
                ...item,
                studentSelections: [...studentIds, '', '', ''].slice(0, 3)
            });
        } else {
            setEditItem(item);
        }
        setIsCreating(false);
    };

    const openCreate = () => {
        if (selectedResource === 'students') {
            setEditItem({ techziteId: '', name: '', email: '', phoneNumber: '' });
        } else if (selectedResource === 'groups') {
            setEditItem({ groupId: '', studentSelections: ['', '', ''] });
        } else if (selectedResource === 'quizzes') {
            setEditItem({ title: '', questions: [{ text: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }] });
        }
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
                    <button className={activeTab === 'results' ? 'active' : ''} onClick={() => setActiveTab('results')}>
                        <Trophy size={20} /> Quiz Results
                    </button>
                    <button className={activeTab === 'database' ? 'active' : ''} onClick={() => setActiveTab('database')}>
                        <Database size={20} /> Database
                    </button>
                    <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                        <button onClick={logout} style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                            <LogOut size={20} /> Logout
                        </button>
                    </div>
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
                        <h1>Heavy Violators ({">"}2 Violations)</h1>
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

                        <div className="controls glass" style={{
                            marginBottom: '2rem',
                            padding: '1.5rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1.5rem',
                            alignItems: 'end',
                            borderRadius: '12px'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#94a3b8' }}>Select Collection</label>
                                <select
                                    value={selectedResource}
                                    onChange={(e) => setSelectedResource(e.target.value)}
                                    style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '100%', cursor: 'pointer' }}
                                >
                                    <option value="students" style={{ background: '#1e293b' }}>Students</option>
                                    <option value="groups" style={{ background: '#1e293b' }}>Groups</option>
                                    <option value="quizzes" style={{ background: '#1e293b' }}>Quizzes</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#94a3b8' }}>Search Records</label>
                                <input
                                    type="text"
                                    placeholder={`Search in ${selectedResource}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                />
                            </div>

                            <button className="approve" onClick={openCreate} style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0 1.5rem', borderRadius: '8px' }}>
                                <Plus size={20} />
                                <span style={{ fontWeight: 'bold' }}>{selectedResource === 'students' ? 'Add Student' :
                                    selectedResource === 'groups' ? 'Add Group' : 'Add Quiz'}</span>
                            </button>
                        </div>


                        {(editItem || isCreating) && (
                            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '1rem', backdropFilter: 'blur(5px)' }}>
                                <div className="modal glass" style={{
                                    padding: '2.5rem',
                                    width: '850px',
                                    maxWidth: '100%',
                                    background: '#1e293b',
                                    maxHeight: '90vh',
                                    overflowY: 'auto',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                        <h2 style={{ margin: 0 }}>{isCreating ? 'Create New' : 'Edit Item'} ({selectedResource})</h2>
                                        <button onClick={() => { setEditItem(null); setIsCreating(false); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        {selectedResource === 'students' && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8' }}>Techzite ID</label>
                                                    <input
                                                        type="text"
                                                        value={editItem?.techziteId || ''}
                                                        onChange={e => setEditItem({ ...editItem, techziteId: e.target.value })}
                                                        placeholder="e.g. TZ250001"
                                                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8' }}>Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={editItem?.name || ''}
                                                        onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                                        placeholder="Student Full Name"
                                                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8' }}>Email Address (Optional)</label>
                                                    <input
                                                        type="email"
                                                        value={editItem?.email || ''}
                                                        onChange={e => setEditItem({ ...editItem, email: e.target.value })}
                                                        placeholder="email@example.com"
                                                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8' }}>Phone Number</label>
                                                    <input
                                                        type="text"
                                                        value={editItem?.phoneNumber || ''}
                                                        onChange={e => setEditItem({ ...editItem, phoneNumber: e.target.value })}
                                                        placeholder="10-digit number"
                                                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {selectedResource === 'groups' && (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8' }}>Group ID (e.g. TZ250001_TZ250002)</label>
                                                    <input
                                                        type="text"
                                                        value={editItem?.groupId || ''}
                                                        onChange={e => setEditItem({ ...editItem, groupId: e.target.value })}
                                                        placeholder="Unique Group ID"
                                                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8' }}>Select Members ({editItem?.studentSelections?.filter((id: any) => id).length || 0}/3)</label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                                        {[0, 1, 2].map(idx => (
                                                            <select
                                                                key={idx}
                                                                value={editItem?.studentSelections?.[idx] || ''}
                                                                onChange={e => {
                                                                    const newSels = [...(editItem?.studentSelections || ['', '', ''])];
                                                                    newSels[idx] = e.target.value;
                                                                    setEditItem({ ...editItem, studentSelections: newSels });
                                                                }}
                                                                style={{ padding: '0.75rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white', cursor: 'pointer' }}
                                                            >
                                                                <option value="">-- Member {idx + 1} --</option>
                                                                {studentsList.map(s => (
                                                                    <option key={s._id} value={s._id}>{s.name} ({s.techziteId})</option>
                                                                ))}
                                                            </select>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}


                                        {selectedResource === 'quizzes' && (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <label style={{ fontSize: '0.875rem' }}>Quiz Title</label>
                                                    <input
                                                        type="text"
                                                        value={editItem?.title || ''}
                                                        onChange={e => setEditItem({ ...editItem, title: e.target.value })}
                                                        style={{ padding: '0.75rem', borderRadius: '4px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <label style={{ fontSize: '1rem', fontWeight: 'bold' }}>Questions ({editItem?.questions?.length || 0})</label>
                                                        <button
                                                            onClick={() => {
                                                                const qs = [...(editItem?.questions || [])];
                                                                qs.push({ text: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 });
                                                                setEditItem({ ...editItem, questions: qs });
                                                            }}
                                                            style={{ padding: '0.5rem 1rem', background: '#10b981', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                                                        >+ Add Question</button>
                                                    </div>

                                                    {editItem?.questions?.map((q: any, qIdx: number) => (
                                                        <div key={qIdx} style={{ padding: '1.5rem', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <label>Question {qIdx + 1}</label>
                                                                <button
                                                                    onClick={() => {
                                                                        const qs = editItem.questions.filter((_: any, i: number) => i !== qIdx);
                                                                        setEditItem({ ...editItem, questions: qs });
                                                                    }}
                                                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                                >Remove</button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={q.text}
                                                                placeholder="Question text"
                                                                onChange={e => {
                                                                    const qs = [...editItem.questions];
                                                                    qs[qIdx].text = e.target.value;
                                                                    setEditItem({ ...editItem, questions: qs });
                                                                }}
                                                                style={{ padding: '0.75rem', borderRadius: '4px', background: '#1e293b', border: '1px solid #334155', color: 'white' }}
                                                            />
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                                {q.options.map((opt: string, oIdx: number) => (
                                                                    <div key={oIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                        <input
                                                                            type="radio"
                                                                            name={`q-${qIdx}-correct`}
                                                                            checked={q.correctAnswer === oIdx}
                                                                            onChange={() => {
                                                                                const qs = [...editItem.questions];
                                                                                qs[qIdx].correctAnswer = oIdx;
                                                                                setEditItem({ ...editItem, questions: qs });
                                                                            }}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={opt}
                                                                            placeholder={`Option ${oIdx + 1}`}
                                                                            onChange={e => {
                                                                                const qs = [...editItem.questions];
                                                                                qs[qIdx].options[oIdx] = e.target.value;
                                                                                setEditItem({ ...editItem, questions: qs });
                                                                            }}
                                                                            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', background: '#1e293b', border: '1px solid #334155', color: 'white' }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <label>Points:</label>
                                                                <input
                                                                    type="number"
                                                                    value={q.points}
                                                                    onChange={e => {
                                                                        const qs = [...editItem.questions];
                                                                        qs[qIdx].points = parseInt(e.target.value) || 1;
                                                                        setEditItem({ ...editItem, questions: qs });
                                                                    }}
                                                                    style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', background: '#1e293b', border: '1px solid #334155', color: 'white' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
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
                                        {selectedResource === 'students' && (
                                            <>
                                                <th>TechID</th>
                                                <th>Name</th>
                                                <th>Phone</th>
                                                <th>Email</th>
                                            </>
                                        )}
                                        {selectedResource === 'groups' && (
                                            <>
                                                <th style={{ padding: '1rem' }}>Students Details (Name, TID, Email, Phone)</th>
                                                <th style={{ padding: '1rem' }}>Overall Status</th>
                                            </>
                                        )}

                                        {selectedResource === 'quizzes' && (
                                            <>
                                                <th>Title</th>
                                                <th>Questions</th>
                                            </>
                                        )}
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item: any) => (
                                        <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            {selectedResource === 'students' && (
                                                <>
                                                    <td style={{ padding: '1rem' }}>{item.techziteId}</td>
                                                    <td style={{ padding: '1rem' }}>{item.name}</td>
                                                    <td style={{ padding: '1rem' }}>{item.phoneNumber}</td>
                                                    <td style={{ padding: '1rem' }}>{item.email || 'N/A'}</td>
                                                </>
                                            )}
                                            {selectedResource === 'groups' && (
                                                <>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                            {item.students && item.students.length > 0
                                                                ? item.students.map((s: any, sIdx: number) => (
                                                                    <div key={sIdx} style={{
                                                                        padding: '0.75rem',
                                                                        background: 'rgba(255,255,255,0.05)',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                                    }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                                            <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{s.name || 'Unknown'}</span>
                                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>ID: {s.techziteId || 'N/A'}</span>
                                                                        </div>
                                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '1rem' }}>
                                                                            <span>📧 {s.email || 'N/A'}</span>
                                                                            <span>📞 {s.phoneNumber || 'N/A'}</span>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                                : <span style={{ color: '#64748b', fontStyle: 'italic' }}>No members added</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span className={`badge ${item.quizState?.isFinished ? 'success' : 'warning'}`} style={{
                                                            padding: '0.4rem 1rem',
                                                            borderRadius: '8px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 'bold',
                                                            background: item.quizState?.isFinished ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                            color: item.quizState?.isFinished ? '#10b981' : '#f59e0b',
                                                            border: `1px solid ${item.quizState?.isFinished ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem'
                                                        }}>
                                                            {item.quizState?.isFinished ? '✅ Finished' : '⌛ In Progress'}
                                                        </span>
                                                    </td>
                                                </>
                                            )}


                                            {selectedResource === 'quizzes' && (
                                                <>
                                                    <td style={{ padding: '1rem' }}>{item.title || 'Quiz'}</td>
                                                    <td style={{ padding: '1rem' }}>{item.questions?.length || 0} Qs</td>
                                                </>
                                            )}

                                            <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => openEdit(item)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>Edit</button>
                                                <button onClick={() => handleDeleteResource(item._id)} style={{ padding: '0.5rem 1rem', background: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No records found matching your search.</td>
                                        </tr>
                                    )}

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
