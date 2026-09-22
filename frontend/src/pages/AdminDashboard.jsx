import { useState } from "react";
import { Link } from "react-router-dom";
import { useCompanies } from "../context/CompaniesContext";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";
import IconToggleButton from "../components/IconToggleButton";
import SettingsIcon from "../components/icons/SettingsIcon";
import CompanySettingsModal from "../components/CompanySettingsModal";
import AddCompanyModal from "../components/AddCompanyModal";
import BatchDatesModal from "../components/BatchDatesModal";
import { exportCompaniesXlsx, exportCompaniesPdf } from "../utils/adminExport";

export default function AdminDashboard() {
  const {
    companies,
    batches,
    saveBatches,
    loading,
    addCompany,
    updateCompanySettings,
    deleteCompany,
  } = useCompanies();
  const [settingsCompanyId, setSettingsCompanyId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [batchesOpen, setBatchesOpen] = useState(false);

  // batch number -> { startDate, endDate }
  const batchDates = new Map(batches.map((b) => [b.batch, b]));

  const totalSubscribed = companies.filter((c) => c.subscribed).length;
  const totalReadiness = companies.filter((c) => c.filledReadinessForm).length;
  const totalMaturity = companies.filter((c) => c.filledMaturityTest).length;

  const settingsCompany =
    companies.find((c) => c.id === settingsCompanyId) || null;

  async function handleAddCompany(details) {
    await addCompany(details);
    setAddOpen(false);
  }

  async function handleDeleteCompany(companyId) {
    await deleteCompany(companyId);
    setSettingsCompanyId(null);
  }

  return (
    <div className="page">
      <Header subtitle="Admin" />
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
                onClick={() => exportCompaniesXlsx(companies)}
              >
                Export XLSX
              </button>
              <button
                className="btn-secondary"
                onClick={() => exportCompaniesPdf(companies)}
              >
                Export PDF
              </button>
              <button className="btn-secondary" onClick={() => setBatchesOpen(true)}>
                Edit batches
              </button>
              <button className="btn-primary" onClick={() => setAddOpen(true)}>
                + Add company
              </button>
            </div>
          </div>

          {loading ? (
            <p className="loading-state">Loading companies…</p>
          ) : (
            <div className="table-wrapper">
              <table className="company-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Batch</th>
                    <th>Start date</th>
                    <th>End date</th>
                    <th>KTH - IRL</th>
                    <th>AI Maturity Test</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.settings.batch}</td>
                      <td>{batchDates.get(c.settings.batch)?.startDate ?? "—"}</td>
                      <td>{batchDates.get(c.settings.batch)?.endDate ?? "—"}</td>
                      <td>
                        <StatusBadge filled={c.filledReadinessForm} />
                      </td>
                      <td>
                        <StatusBadge filled={c.filledMaturityTest} />
                      </td>
                      <td>
                        <div className="company-table__actions">
                          <Link
                            className="btn-link"
                            to={`/admin/companies/${c.id}`}
                          >
                            View details
                          </Link>
                          <IconToggleButton
                            icon={<SettingsIcon />}
                            tooltip="Company settings"
                            onClick={() => setSettingsCompanyId(c.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {settingsCompany && (
        <CompanySettingsModal
          company={settingsCompany}
          onClose={() => setSettingsCompanyId(null)}
          onSave={(settings) =>
            updateCompanySettings(settingsCompany.id, settings)
          }
          onDelete={() => handleDeleteCompany(settingsCompany.id)}
        />
      )}

      {batchesOpen && (
        <BatchDatesModal
          batches={batches}
          onClose={() => setBatchesOpen(false)}
          onSave={saveBatches}
        />
      )}

      {addOpen && (
        <AddCompanyModal
          onClose={() => setAddOpen(false)}
          onAdd={handleAddCompany}
        />
      )}
    </div>
  );
}
