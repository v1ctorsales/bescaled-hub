import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCompanyData } from "../context/CompanyDataContext";
import Header from "../components/Header";
import ActionCard from "../components/ActionCard";

export default function UserDashboard() {
  const { user } = useAuth();
  const { readinessFormFilled, maturityTestFilled } = useCompanyData();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="page">
      <Header title="BeScaled Hub " />
      <main className="page__content">
        <div className="hub-intro">
          <h2>Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h2>
          <p>Pick up where you left off, or start a new assessment.</p>
        </div>

        <div className="action-card-grid">
          <ActionCard
            to="/dashboard/readiness"
            icon="📈"
            title="Innovation Readiness Level"
            description="Score your company across CRL, TRL, BRL, IPRL, TmRL and FRL, and track progress year over year."
            completed={readinessFormFilled}
          />
          <ActionCard
            to="/dashboard/maturity-test"
            icon="🤖"
            title="AI Maturity Test"
            description="Answer a short questionnaire to assess your company's AI maturity."
            completed={maturityTestFilled}
          />
        </div>
      </main>
    </div>
  );
}
