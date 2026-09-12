import { useState } from "react";
import Modal from "./Modal";

const MAX_LOGIN_EMAILS = 3;

// TODO(backend): `onSave`/`onDelete` write straight into the shared
// mockCompanies record since there's no API yet — replace with real
// PATCH/DELETE /companies/:id calls once a backend exists.
export default function CompanySettingsModal({ company, onClose, onSave, onDelete }) {
  const [loginEmails, setLoginEmails] = useState(company.settings.loginEmails);
  const [notes, setNotes] = useState(company.settings.notes);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function updateEmail(index, value) {
    setLoginEmails((prev) => prev.map((email, i) => (i === index ? value : email)));
  }

  function addEmail() {
    if (loginEmails.length >= MAX_LOGIN_EMAILS) return;
    setLoginEmails((prev) => [...prev, ""]);
  }

  function removeEmail(index) {
    setLoginEmails((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    onSave({
      loginEmails: loginEmails.map((e) => e.trim()).filter(Boolean),
      notes,
    });
    onClose();
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

        <div className="company-settings__field">
          <label>Login emails</label>
          {loginEmails.map((email, index) => (
            <div key={index} className="company-settings__email-row">
              <input
                type="email"
                value={email}
                placeholder="name@company.com"
                onChange={(e) => updateEmail(index, e.target.value)}
              />
              <button
                type="button"
                className="btn-link"
                onClick={() => removeEmail(index)}
              >
                Remove
              </button>
            </div>
          ))}
          {loginEmails.length < MAX_LOGIN_EMAILS && (
            <button type="button" className="company-settings__add-email" onClick={addEmail}>
              + Add email ({loginEmails.length}/{MAX_LOGIN_EMAILS})
            </button>
          )}
        </div>

        <div className="company-settings__field">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            placeholder="Internal notes about this company..."
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {confirmingDelete && (
          <p className="company-settings__confirm-text">
            Are you sure you want to delete <strong>{company.name}</strong>? This will
            permanently remove all of its readiness and maturity data and cannot be undone.
          </p>
        )}

        <div className="company-settings__actions">
          {!confirmingDelete ? (
            <>
              <button
                type="button"
                className="btn-danger"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete company
              </button>
              <div className="company-settings__actions-right">
                <button className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSave}>
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="btn-danger" onClick={onDelete}>
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
