import { apiFetch } from "./apiConfig";

// Admin-only: when each program batch (1-9) starts and ends, as "MM/YYYY"
// (null until set). Always one entry per batch: { batch, startDate, endDate }.
export async function getBatches() {
  return apiFetch("/batches");
}

// Saves the dates of the batches in `batches` in one request; returns the full list.
export async function saveBatches(batches) {
  return apiFetch("/batches", {
    method: "PUT",
    body: JSON.stringify({ batches }),
  });
}
