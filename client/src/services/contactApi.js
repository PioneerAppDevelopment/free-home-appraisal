const API_BASE_URL = process.env.REACT_APP_API_URL || "";

const ContactApi = {
  sendMessage: async ({ name, email, message }) => {
    const response = await fetch(`${API_BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message })
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || "Message could not be sent.");
    }

    return body;
  }
};

export default ContactApi;
