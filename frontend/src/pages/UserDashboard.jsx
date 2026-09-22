import { useAuth } from "../context/AuthContext";
import { useCompanyData } from "../context/CompanyDataContext";
import Header from "../components/Header";
import ActionCard from "../components/ActionCard";
import { getReadinessCompletionPercent } from "../utils/readinessProgress";
import { TOTAL_MATURITY_ITEMS } from "../data/maturityDimensions";

export default function UserDashboard() {
  const { user } = useAuth();
  const { savedReadinessLevels, savedGuideProgress, maturityTouched, loading } = useCompanyData();

  if (loading) {
    return (
      <div className="page">
        <Header />
        <main className="page__content">
          <p className="loading-state">Loading your dashboard…</p>
        </main>
      </div>
    );
  }

  // Saved progress only: 50% readiness chart + 50% level-guide sections (see utils/readinessProgress.js).
  const readinessPercent = getReadinessCompletionPercent(savedReadinessLevels, savedGuideProgress);
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
