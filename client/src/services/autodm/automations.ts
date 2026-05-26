import apiClient from "@/utils/apiClient";

function unwrap(response, key) {
  if (!response.data?.success) {
    throw new Error(response.data?.error || "Auto DM request failed");
  }
  return response.data[key];
}

export async function listAutomations({ instagramAccountId }) {
  const response = await apiClient.get("/api/autodm/automations", {
    params: instagramAccountId ? { instagramAccountId } : {},
  });
  return unwrap(response, "automations") || [];
}

export async function getAutomationById(id) {
  const response = await apiClient.get(`/api/autodm/automations/${id}`);
  return unwrap(response, "automation");
}

export async function createAutomation(payload) {
  const response = await apiClient.post("/api/autodm/automations", payload);
  return unwrap(response, "automation");
}

export async function updateAutomation(id, _userId, payload) {
  const response = await apiClient.patch(`/api/autodm/automations/${id}`, payload);
  return unwrap(response, "automation");
}

export async function deleteAutomation(id) {
  const response = await apiClient.delete(`/api/autodm/automations/${id}`);
  if (!response.data?.success) {
    throw new Error(response.data?.error || "Failed to delete Auto DM automation");
  }
}
