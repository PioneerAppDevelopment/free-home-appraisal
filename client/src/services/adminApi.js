const API_BASE_URL = process.env.REACT_APP_API_URL || "";

const AdminApi = {
  getUsage: async (month, token) => {
    const params = new URLSearchParams();
    if (month) {
      params.set("month", month);
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/usage?${params}`, {
      headers: token ? { "x-admin-token": token } : {}
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || `Usage request failed with ${response.status}`);
    }

    return body;
  },
  resetUsage: async (ipAddress, month, token) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/usage/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'x-admin-token': token } : {}) }, body: JSON.stringify({ ipAddress, month }) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Quota reset failed.');
  }
};

export default AdminApi;
