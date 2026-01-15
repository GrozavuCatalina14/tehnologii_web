import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ManagerTasks = () => {
    const { token, user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [executants, setExecutants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
        fetchExecutants();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setTasks(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setLoading(false);
        }
    };

    const fetchExecutants = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setExecutants(data.filter(u => u.role === 'executant'));
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleAssign = async (taskId, assignedTo) => {
        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}/assign`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ assignedTo })
            });
            fetchTasks();
        } catch (error) {
            console.error('Error assigning task:', error);
        }
    };

    const handleClose = async (taskId) => {
        if (!confirm('Are you sure you want to close this task?')) return;
        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}/close`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTasks();
        } catch (error) {
            console.error('Error closing task:', error);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Team Tasks</h2>
                <a href="/manager/create-task" className="btn btn-primary">Create New Task</a>
            </div>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {tasks.map(task => (
                    <div key={task.id} className="card" style={{ borderLeft: `4px solid ${task.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-primary)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(task.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{task.title}</h3>
                        <p style={{ color: '#555', marginBottom: '1rem' }}>{task.description}</p>

                        <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                <strong>Assigned to:</strong> {task.Assignee ? task.Assignee.name : 'Unassigned'}
                            </p>

                            {task.status === 'OPEN' && (
                                <select
                                    className="input"
                                    style={{ padding: '0.3rem' }}
                                    onChange={(e) => handleAssign(task.id, e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Assign to...</option>
                                    {executants.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                                    ))}
                                </select>
                            )}

                            {task.status === 'COMPLETED' && (
                                <button onClick={() => handleClose(task.id)} className="btn btn-outline" style={{ fontSize: '0.8rem', width: '100%' }}>
                                    Close Task
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManagerTasks;
