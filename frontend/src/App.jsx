import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CompanyDataProvider } from "./context/CompanyDataContext";
import { CompaniesProvider } from "./context/CompaniesContext";
import RequireRole from "./components/RequireRole";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import ReadinessLevelPage from "./pages/ReadinessLevelPage";
import MaturityTestPage from "./pages/MaturityTestPage";
import AdminDashboard from "./pages/AdminDashboard";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import "./App.css";

const Admin = ({ children }) => <RequireRole role="admin">{children}</RequireRole>;
const Company = ({ children }) => <RequireRole role="company">{children}</RequireRole>;

// Data providers are keyed by the logged-in account, so logging out and in as
// someone else remounts them and no previous user's data can linger.
function SessionData({ children }) {
  const { user } = useAuth();
  const key = user?.email ?? "anonymous";
  return (
    <CompanyDataProvider key={key}>
      <CompaniesProvider key={key}>{children}</CompaniesProvider>
    </CompanyDataProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <SessionData>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Company><UserDashboard /></Company>} />
          <Route path="/dashboard/readiness" element={<Company><ReadinessLevelPage /></Company>} />
          <Route path="/dashboard/maturity-test" element={<Company><MaturityTestPage /></Company>} />
          <Route path="/admin" element={<Admin><AdminDashboard /></Admin>} />
          <Route path="/admin/companies/:id" element={<Admin><CompanyDetailPage /></Admin>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SessionData>
    </AuthProvider>
  );
}

export default App;
