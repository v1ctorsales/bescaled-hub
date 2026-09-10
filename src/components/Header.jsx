import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Header({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header__brand">{title}</div>
      <div className="app-header__actions">
        <ThemeToggle />
        {user && (
          <div className="app-header__user">
            <img src={user.avatar} alt={user.name} className="app-header__avatar" />
            <span>{user.name}</span>
            <button className="btn-link" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
