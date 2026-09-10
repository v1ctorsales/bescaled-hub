import { createContext, useContext, useState } from "react";
import { mockCompanies } from "../data/mockCompanies";

// ---------------------------------------------------------------------------
// "Current company" data for the logged-in user's dashboard.
// TODO(backend): the current company should come from the authenticated
// user's session/account, not be hardcoded to the first mock company. Reads
// and writes below should become real API calls once a backend exists.
// ---------------------------------------------------------------------------

const MY_COMPANY = mockCompanies[0];

const CompanyDataContext = createContext(null);

export function CompanyDataProvider({ children }) {
  const [readinessLevels, setReadinessLevels] = useState(MY_COMPANY.readinessLevels);
  const [readinessFormFilled, setReadinessFormFilled] = useState(MY_COMPANY.filledReadinessForm);
  const [maturityTestFilled, setMaturityTestFilled] = useState(MY_COMPANY.filledMaturityTest);
  const [maturityAnswers, setMaturityAnswers] = useState(MY_COMPANY.maturityAnswers);

  function updateReadiness(year, metric, value) {
    setReadinessLevels((prev) => ({
      ...prev,
      [year]: { ...prev[year], [metric]: value },
    }));
    setReadinessFormFilled(true);
  }

  function submitMaturityTest(answers) {
    setMaturityAnswers(answers);
    setMaturityTestFilled(true);
  }

  return (
    <CompanyDataContext.Provider
      value={{
        companyName: MY_COMPANY.name,
        readinessLevels,
        readinessFormFilled,
        updateReadiness,
        maturityTestFilled,
        maturityAnswers,
        submitMaturityTest,
      }}
    >
      {children}
    </CompanyDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompanyData() {
  const ctx = useContext(CompanyDataContext);
  if (!ctx) throw new Error("useCompanyData must be used within CompanyDataProvider");
  return ctx;
}
