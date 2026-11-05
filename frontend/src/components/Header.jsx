import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { homePathFor } from "../utils/homePath";

export default function Header({ subtitle }) {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <Link className="app-header__brand-link" to={user ? homePathFor(user) : "/login"}>
          <h1 className="app-header__brand-text">BeScaled</h1>
        </Link>
        {subtitle && <span className="app-header__subtitle">{subtitle}</span>}
      </div>
      <div className="app-header__user">
        <ThemeToggle />
        {user && (<>
          {user.role === "admin" && <Link className="btn-link app-header__help" to="/admin/help">Platform Guide</Link>}
          <img src={user.avatar} alt={user.name} className="app-header__avatar" />
          <span>{user.name}</span>
          <button className="btn-link" onClick={logout}>
            Log out
          </button>
        </>)}
      </div>
    </header>
  );
}
