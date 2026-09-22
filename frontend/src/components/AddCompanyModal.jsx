import { useState } from "react";
import Modal from "./Modal";
import CompanySettingsFields from "./CompanySettingsFields";
import { isValidEmail, validateCompanySettings } from "../utils/validation";

// `onAdd` is wired by AdminDashboard to CompaniesContext's `addCompany`, which
// posts to the backend and must return a promise: the modal stays open (showing
// the server's message) if it rejects, and closes only on success. The fields
// after name/contact email are the same company settings CompanySettingsModal edits.
export default function AddCompanyModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loginEmails, setLoginEmails] = useState([]);
  const [description, setDescription] = useState("");
  const [batch, setBatch] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const contactEmailValue = contactEmail.trim().toLowerCase();
  const nameError = name.trim() ? undefined : "Company name is required.";
  const contactEmailError = !contactEmailValue
    ? "Primary contact email is required."
    : !isValidEmail(contactEmailValue)
      ? "Enter a valid email address."
      : undefined;
  const settingsErrors = validateCompanySettings({ loginEmails, description });
  const hasErrors = Boolean(nameError || contactEmailError) || settingsErrors.hasErrors;

  // Once the user has tried to submit, messages are shown live.
  const show = submitted;

  async function handleSubmit() {
    setSubmitted(true);
    if (hasErrors) return;
    setBusy(true);
    setSubmitError("");
    try {
      await onAdd({
        name: name.trim(),
        contactEmail: contactEmailValue,
        loginEmails: loginEmails.map((e) => e.trim().toLowerCase()).filter(Boolean),
        description,
        batch,
      });
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Add company" onClose={onClose}>
      <div className="company-settings">
        <div className="company-settings__field">
          <label>Company name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Company name"
            aria-invalid={show && Boolean(nameError)}
            autoFocus
          />
          {show && nameError && <p className="company-settings__field-error">{nameError}</p>}
        </div>

        <div className="company-settings__field">
          <label>Primary contact email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="name@company.com"
            aria-invalid={show && Boolean(contactEmailError)}
          />
          {show && contactEmailError && (
            <p className="company-settings__field-error">{contactEmailError}</p>
          )}
        </div>

        <CompanySettingsFields
          loginEmails={loginEmails}
          onLoginEmailsChange={setLoginEmails}
          loginEmailsHint="If left empty, the primary contact email is used to log in."
          loginEmailErrors={show ? settingsErrors.loginEmailErrors : undefined}
          description={description}
          onDescriptionChange={setDescription}
          descriptionError={show ? settingsErrors.descriptionError : undefined}
          batch={batch}
          onBatchChange={setBatch}
        />

        {submitError && (
          <p className="company-settings__field-error" role="alert">
            {submitError}
          </p>
        )}

        <div className="company-settings__actions">
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={busy}>
            {busy ? "Adding…" : "Add company"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
