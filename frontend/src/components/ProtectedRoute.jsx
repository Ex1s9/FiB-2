import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LEVEL = { user: 1, seller: 2, admin: 3 };

export default function ProtectedRoute({ children, minRole }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (minRole && (ROLE_LEVEL[user.role] || 0) < (ROLE_LEVEL[minRole] || 0)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
