import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layout/DashboardLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminUsers from './pages/admin/AdminUsers';
import { useAuth } from './context/AuthContext';

import ManagerTasks from './pages/manager/ManagerTasks';
import CreateTask from './pages/manager/CreateTask';
import ExecutantTasks from './pages/executant/ExecutantTasks';
import History from './pages/History';

// Placeholders for now
// const AdminUsers = () => <h2>Admin: User Management</h2>;
// const ManagerTasks = () => <h2>Manager: Task Board</h2>;
// const CreateTask = () => <h2>Manager: Create Task</h2>;
// const MyTasks = () => <h2>Executant: My Tasks</h2>;
// const History = () => <h2>Task History</h2>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes */}
          <Route element={<PrivateRoute roles={['admin']} />}>
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          {/* Manager Routes */}
          <Route element={<PrivateRoute roles={['manager']} />}>
            <Route path="/manager/tasks" element={<ManagerTasks />} />
            <Route path="/manager/create-task" element={<CreateTask />} />
            <Route path="/manager/history" element={<History />} />
          </Route>

          {/* Executant Routes */}
          <Route element={<PrivateRoute roles={['executant']} />}>
            <Route path="/my-tasks" element={<ExecutantTasks />} />
            <Route path="/my-history" element={<History />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (user.role === 'admin') return <Navigate to="/admin/users" />;
  if (user.role === 'manager') return <Navigate to="/manager/tasks" />;
  return <Navigate to="/my-tasks" />;
}

export default App;
