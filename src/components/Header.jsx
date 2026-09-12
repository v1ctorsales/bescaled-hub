import { useAuth } from "../context/AuthContext";

export default function Header({ subtitle }) {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <h1 className="app-header__brand-text">BeScaled</h1>
        {subtitle && <span className="app-header__subtitle">{subtitle}</span>}
      </div>
      {user && (
        <div className="app-header__user">
          <img src={user.avatar} alt={user.name} className="app-header__avatar" />
          <span>{user.name}</span>
          <button className="btn-link" onClick={logout}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
