import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";
import { mockCompanies } from "../data/mockCompanies";
import { exportCompaniesCsv, exportCompaniesPdf } from "../utils/adminExport";

export default function AdminDashboard() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const totalSubscribed = mockCompanies.filter((c) => c.subscribed).length;
  const totalReadiness = mockCompanies.filter(
    (c) => c.filledReadinessForm,
  ).length;
  const totalMaturity = mockCompanies.filter(
    (c) => c.filledMaturityTest,
  ).length;

  return (
    <div className="page">
      <Header title="BeScaled Hub  (admin)" />
      <main className="page__content">
        <section className="summary-cards">
          <div className="summary-card">
            <span className="summary-card__value">{totalSubscribed}</span>
            <span className="summary-card__label">companies enrolled</span>
          </div>
          <div className="summary-card">
            <span className="summary-card__value">{totalReadiness}</span>
            <span className="summary-card__label">
              completed the Readiness Level
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-card__value">{totalMaturity}</span>
            <span className="summary-card__label">
              completed the AI Maturity Test
            </span>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>Companies</h2>
            <div className="panel__actions">
              <button
                className="btn-secondary"
                onClick={() => exportCompaniesCsv(mockCompanies)}
              >
                Export CSV
              </button>
              <button
                className="btn-primary"
                onClick={() => exportCompaniesPdf(mockCompanies)}
              >
                Export PDF
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="company-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Readiness Level</th>
                  <th>AI Maturity Test</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {mockCompanies.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <StatusBadge filled={c.filledReadinessForm} />
                    </td>
                    <td>
                      <StatusBadge filled={c.filledMaturityTest} />
                    </td>
                    <td>
                      <Link
                        className="btn-link"
                        to={`/admin/companies/${c.id}`}
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
