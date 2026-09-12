import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCompanyData } from "../context/CompanyDataContext";
import Header from "../components/Header";
import ActionCard from "../components/ActionCard";
import { READINESS_METRICS, READINESS_YEARS } from "../config";
import { TOTAL_MATURITY_ITEMS } from "../data/maturityDimensions";

export default function UserDashboard() {
  const { user } = useAuth();
  const { readinessLevels, maturityTouched } = useCompanyData();

  if (!user) return <Navigate to="/login" replace />;

  const totalReadinessCells = READINESS_YEARS.length * READINESS_METRICS.length;
  const filledReadinessCells = READINESS_YEARS.reduce(
    (count, year) =>
      count +
      READINESS_METRICS.filter(
        (metric) => (readinessLevels[year]?.[metric] ?? 0) > 0,
      ).length,
    0,
  );
  const readinessPercent = (filledReadinessCells / totalReadinessCells) * 100;
  const maturityPercent = (maturityTouched.size / TOTAL_MATURITY_ITEMS) * 100;

  return (
    <div className="page">
      <Header />
      <main className="page__content">
        <div className="hub-intro">
          <h2>Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h2>
          <p>Pick up where you left off, or start a new assessment.</p>
        </div>

        <div className="action-card-grid">
          <ActionCard
            to="/dashboard/readiness"
            title="KTH - Innovation Readiness Level"
            percent={readinessPercent}
          />
          <ActionCard
            to="/dashboard/maturity-test"
            title="AI Maturity Test"
            percent={maturityPercent}
          />
        </div>
      </main>
    </div>
  );
}
