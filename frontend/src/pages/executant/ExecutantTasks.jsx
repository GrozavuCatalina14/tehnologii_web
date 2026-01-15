import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ExecutantTasks = () => {
    const { token } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            // Filter locally or rely on backend (backend filters by assignee for executant)
            setTasks(data.filter(t => t.status !== 'CLOSED'));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setLoading(false);
        }
    };

    const handleComplete = async (taskId) => {
        if (!confirm('Mark this task as completed?')) return;
        try {
            await fetch(`http://localhost:5000/api/tasks/${taskId}/complete`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTasks();
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem' }}>My Tasks</h2>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {tasks.length === 0 && !loading && <p>No active tasks assigned to you.</p>}

                {tasks.map(task => (
                    <div key={task.id} className="card" style={{ borderLeft: `4px solid ${task.status === 'PENDING' ? 'var(--color-warning)' : 'var(--color-success)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(task.assignedAt || task.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{task.title}</h3>
                        <p style={{ color: '#555', marginBottom: '1rem' }}>{task.description}</p>

                        <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                <strong>From:</strong> {task.Creator ? task.Creator.name : 'Manager'}
                            </p>

                            {task.status === 'PENDING' && (
                                <button onClick={() => handleComplete(task.id)} className="btn btn-success" style={{ width: '100%', backgroundColor: 'var(--color-success)', color: 'white' }}>
                                    Mark as Completed
                                </button>
                            )}
                            {task.status === 'COMPLETED' && (
                                <div style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: 'bold' }}>
                                    Waiting for Manager Approval
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExecutantTasks;
