import { useState } from "react";
import Modal from "./Modal";
import { formatMonthYearInput, validateBatchDates } from "../utils/validation";

const FIELDS = [
  { key: "startDate", errorKey: "startError", label: "start" },
  { key: "endDate", errorKey: "endError", label: "end" },
];

// Edits when each batch starts and ends (MM/YYYY). `batches` is the saved list
// ([{ batch, startDate, endDate }], dates null when unset); `onSave` receives the
// same shape and must return a promise — the modal closes only when it succeeds.
export default function BatchDatesModal({ batches, onClose, onSave }) {
  const [rows, setRows] = useState(() =>
    batches.map((b) => ({ batch: b.batch, startDate: b.startDate ?? "", endDate: b.endDate ?? "" })),
  );
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { errors, hasErrors } = validateBatchDates(rows);

  function updateRow(index, field, value) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: formatMonthYearInput(value) } : row)),
    );
  }

  async function handleSave() {
    setSubmitted(true);
    if (hasErrors) return;
    setBusy(true);
    setSubmitError("");
    try {
      await onSave(
        rows.map((r) => ({
          batch: r.batch,
          startDate: r.startDate || null,
          endDate: r.endDate || null,
        })),
      );
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Edit batches" onClose={onClose}>
      <div className="company-settings">
        <p className="company-settings__field-hint">
          Set when each batch starts and ends (MM/YYYY). Leave both empty for a batch that is not
          scheduled yet.
        </p>

        <table className="batch-dates">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Start date</th>
              <th>End date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.batch}>
                <td>{row.batch}</td>
                {FIELDS.map(({ key, errorKey, label }) => {
                  const error = submitted ? errors[index][errorKey] : undefined;
                  return (
                    <td key={key}>
                      <input
                        value={row[key]}
                        placeholder="MM/YYYY"
                        inputMode="numeric"
                        maxLength={7}
                        aria-label={`Batch ${row.batch} ${label} date`}
                        aria-invalid={Boolean(error)}
                        onChange={(e) => updateRow(index, key, e.target.value)}
                      />
                      {error && <p className="company-settings__field-error">{error}</p>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {submitError && (
          <p className="company-settings__field-error" role="alert">
            {submitError}
          </p>
        )}

        <div className="company-settings__actions">
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
