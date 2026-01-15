import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreateTask = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                navigate('/manager/tasks');
            } else {
                alert('Failed to create task');
            }
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Task</h2>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="label">Task Title</label>
                        <input
                            className="input"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="e.g., Update Landing Page"
                        />
                    </div>

                    <div className="input-group">
                        <label className="label">Description</label>
                        <textarea
                            className="input"
                            rows="5"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                            placeholder="Detailed description of the task requirements..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary">Create Task</button>
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/manager/tasks')}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTask;
