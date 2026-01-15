import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminUsers = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'executant',
        managerId: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setUsers(data);
            setManagers(data.filter(u => u.role === 'manager'));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setFormData({ name: '', email: '', password: '', role: 'executant', managerId: '' });
                fetchUsers();
            } else {
                alert('Failed to create user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    return (
        <div>
            <h2>User Management</h2>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>Add New User</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="label">Name</label>
                        <input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="label">Email</label>
                        <input className="input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="label">Password</label>
                        <input className="input" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="label">Role</label>
                        <select className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="manager">Manager</option>
                            <option value="executant">Executant</option>
                        </select>
                    </div>

                    {formData.role === 'executant' && (
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label">Assign Manager</label>
                            <select className="input" value={formData.managerId} onChange={e => setFormData({ ...formData, managerId: e.target.value })} required>
                                <option value="">Select Manager</option>
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary">Create User</button>
                </form>
            </div>

            <div className="card">
                <h3>All Users</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-secondary)' }}>
                                <th style={{ padding: '0.5rem' }}>Name</th>
                                <th style={{ padding: '0.5rem' }}>Email</th>
                                <th style={{ padding: '0.5rem' }}>Role</th>
                                <th style={{ padding: '0.5rem' }}>Manager</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.5rem' }}>{user.name}</td>
                                    <td style={{ padding: '0.5rem' }}>{user.email}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <span className={`badge badge-${user.role === 'admin' ? 'closed' : user.role === 'manager' ? 'pending' : 'completed'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>{user.Manager ? user.Manager.name : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
