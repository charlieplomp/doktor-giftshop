// Vercel Serverless Function — ontvangt betaalstatus-updates van Mollie
const { createMollieClient } = require("@mollie/api-client");

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
      console.log("Betaling ontvangen — verstuur naar:", {
        betalingId: payment.id,
        bedrag: payment.amount,
        omschrijving: payment.description,
        artikelen: payment.metadata && payment.metadata.items,
        klant: payment.metadata && payment.metadata.klant
      });
    } else {
      console.log(`Betaling ${payment.id} heeft status "${payment.status}", nog geen actie ondernomen.`);
    }

    return res.status(200).end();
  } catch (error) {
    console.error("Fout bij het verwerken van de Mollie-webhook:", error);
    return res.status(500).end();
  }
};
