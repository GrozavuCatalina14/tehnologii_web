import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const History = () => {
    const { token } = useAuth();
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            // Filter for history (COMPLETED or CLOSED) - technically history is mostly CLOSED
            setTasks(data.filter(t => t.status === 'CLOSED' || t.status === 'COMPLETED'));
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Task History</h2>
            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-secondary)' }}>
                            <th style={{ padding: '0.5rem' }}>Title</th>
                            <th style={{ padding: '0.5rem' }}>Status</th>
                            <th style={{ padding: '0.5rem' }}>Assignee</th>
                            <th style={{ padding: '0.5rem' }}>Closed Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.5rem' }}>{task.title}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
                                </td>
                                <td style={{ padding: '0.5rem' }}>{task.Assignee ? task.Assignee.name : '-'}</td>
                                <td style={{ padding: '0.5rem' }}>{task.closedAt ? new Date(task.closedAt).toLocaleDateString() : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default History;
