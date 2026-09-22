// Vercel Serverless Function — ontvangt betaalstatus-updates van Mollie
const { createMollieClient } = require("@mollie/api-client");
const { Resend } = require("resend");

const BESTEL_EMAIL = "chcplomp@gmail.com";

function formatPrice(amount) {
  return "€ " + Number(amount).toFixed(2).replace(".", ",");
}

async function stuurBestelmail(payment) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("RESEND_API_KEY ontbreekt — geen bestelmail verstuurd.");
    return;
  }

  const items = (payment.metadata && payment.metadata.items) || [];
  const klant = (payment.metadata && payment.metadata.klant) || {};

  const itemsHtml = items
    .map(item => `<tr><td style="padding:4px 12px 4px 0;">${item.name}</td><td style="padding:4px 12px;">× ${item.qty}</td><td style="padding:4px 0; text-align:right;">${formatPrice(item.price * item.qty)}</td></tr>`)
    .join("");

  const html = `
    <h2>Nieuwe bestelling — ${formatPrice(payment.amount.value)}</h2>
    <p><strong>Klant:</strong> ${klant.naam || "-"}${klant.bedrijfsnaam ? ` (${klant.bedrijfsnaam})` : ""}</p>
    <p><strong>Adres:</strong> ${klant.adres || "-"}</p>
    <p><strong>Telefoon:</strong> ${klant.telefoon || "-"}</p>
    <p><strong>E-mail:</strong> ${klant.email || "-"}</p>
    <table style="border-collapse:collapse; margin:16px 0;">${itemsHtml}</table>
    <p><strong>Subtotaal (excl. btw):</strong> ${formatPrice(payment.metadata.subtotaalExclBtw)}<br>
    <strong>Btw:</strong> ${formatPrice(payment.metadata.btw)}<br>
    <strong>Totaal:</strong> ${formatPrice(payment.metadata.totaalInclBtw)}</p>
    <p style="color:#666; font-size:0.85em;">Mollie betalings-ID: ${payment.id}</p>
  `;

  const resend = new Resend(resendKey);
  const result = await resend.emails.send({
    from: "Dr. Gift Shop <onboarding@resend.dev>",
    to: BESTEL_EMAIL,
    subject: `Nieuwe bestelling — ${formatPrice(payment.amount.value)}`,
    html
  });

  if (result.error) {
    console.error("Bestelmail versturen mislukt:", result.error);
  } else {
    console.log("Bestelmail verstuurd naar", BESTEL_EMAIL, "-", result.data && result.data.id);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const apiKey = process.env.MOLLIE_API_KEY;
  const paymentId = req.body && req.body.id;

  if (!apiKey) {
    console.error("MOLLIE_API_KEY ontbreekt in de omgevingsvariabelen.");
    return res.status(500).end();
  }

  if (!paymentId) {
    console.error("Webhook ontving geen betalings-ID.");
    return res.status(400).end();
  }

  try {
    const mollieClient = createMollieClient({ apiKey });
    const payment = await mollieClient.payments.get(paymentId);

    if (payment.status === "paid") {
      console.log("Betaling ontvangen:", {
        betalingId: payment.id,
        bedrag: payment.amount,
        omschrijving: payment.description,
        artikelen: payment.metadata && payment.metadata.items,
        klant: payment.metadata && payment.metadata.klant
      });
      await stuurBestelmail(payment);
    } else {
      console.log(`Betaling ${payment.id} heeft status "${payment.status}", nog geen actie ondernomen.`);
    }

    return res.status(200).end();
  } catch (error) {
    console.error("Fout bij het verwerken van de Mollie-webhook:", error);
    return res.status(500).end();
  }
};

module.exports.stuurBestelmail = stuurBestelmail;
