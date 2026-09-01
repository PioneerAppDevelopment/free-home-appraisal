function sanitize(value) {
  return String(value || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateContactMessage(body = {}) {
  const name = sanitize(body.name);
  const email = sanitize(body.email);
  const message = sanitize(body.message);

  if (!name || !email || !message) {
    return { error: "Name, email, and message are required." };
  }

  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (name.length > 120 || email.length > 254 || message.length > 5000) {
    return { error: "Contact message is too long." };
  }

  return { name, email, message };
}

function mailgunConfig() {
  const domain = process.env.MAILGUN_DOMAIN || "mail1.pioneerapplications.com";

  return {
    apiKey: process.env.MAILGUN_API_KEY,
    domain,
    toEmail: process.env.CONTACT_TO_EMAIL || "info@lheny.com",
    fromEmail: process.env.CONTACT_FROM_EMAIL || `freehomeappraisal@${domain}`,
    apiBaseUrl: process.env.MAILGUN_API_BASE_URL || "https://api.mailgun.net"
  };
}

async function sendContactMessage(body) {
  const config = mailgunConfig();

  if (!config.apiKey) {
    throw new Error("MAILGUN_API_KEY is not configured.");
  }

  const contact = validateContactMessage(body);
  if (contact.error) {
    const error = new Error(contact.error);
    error.statusCode = 400;
    throw error;
  }

  const params = new URLSearchParams({
    from: `FreeHomeAppraisal <${config.fromEmail}>`,
    to: config.toEmail,
    subject: `FreeHomeAppraisal contact form: ${contact.name}`,
    text: [
      `Name: ${contact.name}`,
      `Email: ${contact.email}`,
      "",
      contact.message
    ].join("\n"),
    "h:Reply-To": contact.email
  });

  const response = await fetch(`${config.apiBaseUrl}/v3/${config.domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Mailgun request failed with ${response.status}: ${details}`);
  }

  return { sent: true };
}

module.exports = {
  sendContactMessage,
  validateContactMessage
};
