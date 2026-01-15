import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div style={{ paddingBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>TaskPlan</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Welcome, {user.name}</p>
                </div>

                <nav className="sidebar-nav">
                    {user.role === 'admin' && (
                        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
                            Manage Users
                        </NavLink>
                    )}

                    {user.role === 'manager' && (
                        <>
                            <NavLink to="/manager/tasks" className={({ isActive }) => isActive ? 'active' : ''}>
                                My Team's Tasks
                            </NavLink>
                            <NavLink to="/manager/create-task" className={({ isActive }) => isActive ? 'active' : ''}>
                                Create Task
                            </NavLink>
                        </>
                    )}

                    {user.role === 'executant' && (
                        <NavLink to="/my-tasks" className={({ isActive }) => isActive ? 'active' : ''}>
                            My Tasks
                        </NavLink>
                    )}

                    {/* Common for all roles or specific if needed */}
                    <NavLink to={user.role === 'executant' ? '/my-history' : '/manager/history'} className={({ isActive }) => isActive ? 'active' : ''}>
                        History
                    </NavLink>
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%' }}>
                        Logout
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
