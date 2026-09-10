import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { CompanyDataProvider } from "./context/CompanyDataContext";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import ReadinessLevelPage from "./pages/ReadinessLevelPage";
import MaturityTestPage from "./pages/MaturityTestPage";
import AdminDashboard from "./pages/AdminDashboard";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CompanyDataProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/dashboard/readiness" element={<ReadinessLevelPage />} />
            <Route path="/dashboard/maturity-test" element={<MaturityTestPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/companies/:id" element={<CompanyDetailPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </CompanyDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
