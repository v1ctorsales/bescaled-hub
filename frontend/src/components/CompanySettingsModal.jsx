import { useState } from "react";
import Modal from "./Modal";
import CompanySettingsFields from "./CompanySettingsFields";
import { validateCompanySettings } from "../utils/validation";

// `onSave`/`onDelete` are wired by the caller to CompaniesContext's
// `updateCompanySettings`/`deleteCompany`, which go through
// src/services/companiesService.js. Both must return a promise: the modal stays
// open (showing the server's message) if it rejects, and closes only on success.
export default function CompanySettingsModal({ company, onClose, onSave, onDelete }) {
  const [loginEmails, setLoginEmails] = useState(company.settings.loginEmails);
  const [description, setDescription] = useState(company.settings.description);
  const [batch, setBatch] = useState(company.settings.batch || 1);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Once the user has tried to save, validation is live so messages clear as they fix things.
  const errors = submitted ? validateCompanySettings({ loginEmails, description }) : null;

  async function run(action) {
    setBusy(true);
    setSubmitError("");
    try {
      await action();
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  function handleSave() {
    setSubmitted(true);
    if (validateCompanySettings({ loginEmails, description }).hasErrors) return;
    run(() =>
      onSave({
        loginEmails: loginEmails.map((e) => e.trim().toLowerCase()).filter(Boolean),
        description,
        batch,
      }),
    );
  }

  return (
    <Modal title={`${company.name} — Settings`} onClose={onClose}>
      <div className="company-settings">
        <div className="company-settings__field">
          <label>Company name</label>
          <input value={company.name} disabled />
        </div>

        <div className="company-settings__field">
          <label>Primary contact email</label>
          <input value={company.contactEmail} disabled />
        </div>

        <CompanySettingsFields
          loginEmails={loginEmails}
          onLoginEmailsChange={setLoginEmails}
          description={description}
          loginEmailErrors={errors?.loginEmailErrors}
          onDescriptionChange={setDescription}
          descriptionError={errors?.descriptionError}
          batch={batch}
          onBatchChange={setBatch}
        />

        {confirmingDelete && (
          <p className="company-settings__confirm-text">
            Are you sure you want to delete <strong>{company.name}</strong>? This will
            permanently remove all of its readiness and maturity data and cannot be undone.
          </p>
        )}

        {submitError && (
          <p className="company-settings__field-error" role="alert">
            {submitError}
          </p>
        )}

        <div className="company-settings__actions">
          {!confirmingDelete ? (
            <>
              <button
                type="button"
                className="btn-danger"
                onClick={() => setConfirmingDelete(true)}
                disabled={busy}
              >
                Delete company
              </button>
              <div className="company-settings__actions-right">
                <button className="btn-secondary" onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={busy}>
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-danger"
                onClick={() => run(onDelete)}
                disabled={busy}
              >
                Yes, delete this company
              </button>
              <div className="company-settings__actions-right">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
