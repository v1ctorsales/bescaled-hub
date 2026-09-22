const MAX_LOGIN_EMAILS = 3;
const BATCH_OPTIONS = Array.from({ length: 9 }, (_, i) => i + 1);

// The editable company settings (login emails, description, batch), shared by
// AddCompanyModal and CompanySettingsModal so both always offer the same
// options. State lives in the parent modal; this only renders and reports changes.
export default function CompanySettingsFields({
  loginEmails,
  onLoginEmailsChange,
  loginEmailsHint,
  loginEmailErrors = [],
  description,
  onDescriptionChange,
  descriptionError,
  batch,
  onBatchChange,
}) {
  function updateEmail(index, value) {
    onLoginEmailsChange(loginEmails.map((email, i) => (i === index ? value : email)));
  }

  function addEmail() {
    if (loginEmails.length >= MAX_LOGIN_EMAILS) return;
    onLoginEmailsChange([...loginEmails, ""]);
  }

  function removeEmail(index) {
    onLoginEmailsChange(loginEmails.filter((_, i) => i !== index));
  }

  return (
    <>
      <div className="company-settings__field">
        <label>Login emails</label>
        {loginEmails.map((email, index) => (
          <div key={index}>
            <div className="company-settings__email-row">
              <input
                type="email"
                value={email}
                placeholder="name@company.com"
                aria-invalid={Boolean(loginEmailErrors[index])}
                onChange={(e) => updateEmail(index, e.target.value)}
              />
              <button type="button" className="btn-link" onClick={() => removeEmail(index)}>
                Remove
              </button>
            </div>
            {loginEmailErrors[index] && (
              <p className="company-settings__field-error">{loginEmailErrors[index]}</p>
            )}
          </div>
        ))}
        {loginEmails.length < MAX_LOGIN_EMAILS && (
          <button type="button" className="company-settings__add-email" onClick={addEmail}>
            + Add email ({loginEmails.length}/{MAX_LOGIN_EMAILS})
          </button>
        )}
        {loginEmailsHint && <p className="company-settings__field-hint">{loginEmailsHint}</p>}
      </div>

      <div className="company-settings__field">
        <label>Description *</label>
        <textarea
          value={description}
          placeholder="Internal description of this company..."
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
        {descriptionError && <p className="company-settings__field-error">{descriptionError}</p>}
      </div>

      <div className="company-settings__field">
        <label>Batch</label>
        <select value={batch} onChange={(e) => onBatchChange(Number(e.target.value))}>
          {BATCH_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
