import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">🛍 Shop</Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/">Товары</Link>
            {user.role === "admin" && <Link to="/users">Пользователи</Link>}
            <span className="nav-user">
              {user.first_name} <span className="role-badge">{user.role}</span>
            </span>
            <button onClick={handleLogout} className="btn-link">Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
}
