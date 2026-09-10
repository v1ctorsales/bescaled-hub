import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCompanyData } from "../context/CompanyDataContext";
import Header from "../components/Header";
import ReadinessTable from "../components/ReadinessTable";
import RadarChartView from "../components/RadarChartView";
import { READINESS_YEARS } from "../config";
import { downloadJson } from "../utils/export";

export default function ReadinessLevelPage() {
  const { user } = useAuth();
  const { companyName, readinessLevels, updateReadiness } = useCompanyData();

  if (!user) return <Navigate to="/login" replace />;

  function handleExport() {
    downloadJson(
      { company: companyName, readinessLevels },
      `${companyName.replace(/\s+/g, "_")}_readiness.json`,
    );
  }

  return (
    <div className="page">
      <Header title="BeScaled Hub " />
      <main className="page__content">
        <Link to="/dashboard" className="back-link">
          ← Back to dashboard
        </Link>

        <section className="panel">
          <div className="panel__header">
            <h2>Current Innovation Readiness Level</h2>
            <button className="btn-secondary" onClick={handleExport}>
              Export my data
            </button>
          </div>

          <ReadinessTable
            readinessLevels={readinessLevels}
            years={READINESS_YEARS}
            onChange={updateReadiness}
          />

          <RadarChartView
            readinessLevels={readinessLevels}
            years={READINESS_YEARS}
          />
        </section>
      </main>
    </div>
  );
}
