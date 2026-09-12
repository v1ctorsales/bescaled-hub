import { useState } from "react";
import Modal from "./Modal";

export default function AddCompanyModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const canSubmit = name.trim().length > 0 && contactEmail.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onAdd({ name: name.trim(), contactEmail: contactEmail.trim() });
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
            autoFocus
          />
        </div>

        <div className="company-settings__field">
          <label>Primary contact email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="name@company.com"
          />
        </div>

        <div className="company-settings__actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
            Add company
          </button>
        </div>
      </div>
    </Modal>
  );
}
