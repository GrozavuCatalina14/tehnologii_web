import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ roles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />; // Redirect to home/dashboard if unauthorized
    }

    return <Outlet />;
};

export default PrivateRoute;
