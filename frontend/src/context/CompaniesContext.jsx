import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import * as companiesService from "../services/companiesService";
import * as batchesService from "../services/batchesService";

// ---------------------------------------------------------------------------
// The admin's company directory — single source of truth for the list shown
// on AdminDashboard and read by CompanyDetailPage, backed by
// src/services/companiesService.js. Only loaded for admins (the endpoint is
// admin-only); App.jsx remounts this provider on login/logout.
// ---------------------------------------------------------------------------

const CompaniesContext = createContext(null);

export function CompaniesProvider({ children }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [companies, setCompanies] = useState([]);
  // [{ batch, startDate, endDate }] for batches 1-9 (dates "MM/YYYY" or null).
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(isAdmin);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [data, batchData] = await Promise.all([
          companiesService.getCompanies(),
          batchesService.getBatches(),
        ]);
        if (!cancelled) {
          setCompanies(data);
          setBatches(batchData);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // Exposed separately from the mount effect above so callers (after
  // add/update/delete) can re-fetch on demand.
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companiesService.getCompanies();
      setCompanies(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Each mutation waits for the backend; on success the list is updated from the
  // company the API returned (no refetch), on failure the error propagates so the
  // calling modal can show it and stay open.
  async function addCompany(details) {
    const created = await companiesService.addCompany(details);
    setCompanies((prev) => [...prev, created]);
    return created;
  }

  async function updateCompanySettings(companyId, settings) {
    const updated = await companiesService.updateCompanySettings(companyId, settings);
    setCompanies((prev) => prev.map((c) => (c.id === companyId ? updated : c)));
    return updated;
  }

  // Saves the dates of every batch in one request.
  async function saveBatches(entries) {
    const saved = await batchesService.saveBatches(entries);
    setBatches(saved);
    return saved;
  }

  async function deleteCompany(companyId) {
    await companiesService.deleteCompany(companyId);
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
  }

  return (
    <CompaniesContext.Provider
      value={{
        companies,
        batches,
        saveBatches,
        loading,
        error,
        refetch,
        addCompany,
        updateCompanySettings,
        deleteCompany,
      }}
    >
      {children}
    </CompaniesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompanies() {
  const ctx = useContext(CompaniesContext);
  if (!ctx) throw new Error("useCompanies must be used within CompaniesProvider");
  return ctx;
}
