const API_BASE_URL = process.env.REACT_APP_API_URL || "";

const UsageApi = {
  trackPageVisit: path => {
    const body = JSON.stringify({ path });
    const url = `${API_BASE_URL}/api/page-visit`;

    if (navigator.sendBeacon) {
      const payload = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, payload);
      return;
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    }).catch(() => {});
  }
};

export default UsageApi;
