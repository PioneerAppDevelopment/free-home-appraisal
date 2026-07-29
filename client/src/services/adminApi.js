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
  }
};

export default AdminApi;
