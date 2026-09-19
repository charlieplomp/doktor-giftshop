// Vercel Serverless Function — maakt een Mollie-betaling aan voor een bestelling
const { createMollieClient } = require("@mollie/api-client");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Alleen POST-verzoeken zijn toegestaan." });
  }

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    console.error("MOLLIE_API_KEY ontbreekt in de omgevingsvariabelen.");
    return res.status(500).json({ error: "Betalen is momenteel niet beschikbaar. Probeer het later opnieuw." });
  }

  const { items, total } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "De winkelwagen is leeg." });
  }

  const totalAmount = Number(total);
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return res.status(400).json({ error: "Het totaalbedrag is ongeldig." });
  }

  const description =
    items.length === 1
      ? `Dr. Gift Shop bestelling — ${items[0].name || items[0].id}`
      : `Dr. Gift Shop bestelling — ${items.length} artikelen`;

  try {
    const mollieClient = createMollieClient({ apiKey });
    const origin = `https://${req.headers.host}`;
    const isSecureOrigin = origin.startsWith("https://") && !req.headers.host.includes("localhost");

    const payment = await mollieClient.payments.create({
      amount: {
        currency: "EUR",
        value: totalAmount.toFixed(2)
      },
      description,
      redirectUrl: `${origin}/bevestiging.html`,
      // Mollie accepteert alleen publiek bereikbare https-webhooks; lokaal wordt deze daarom overgeslagen.
      ...(isSecureOrigin ? { webhookUrl: `${origin}/api/webhook` } : {}),
      metadata: {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price
        }))
      }
    });

    return res.status(200).json({ checkoutUrl: payment.getCheckoutUrl() });
  } catch (error) {
    console.error("Fout bij het aanmaken van de Mollie-betaling:", error);
    return res.status(500).json({ error: "Er is iets misgegaan bij het starten van de betaling. Probeer het opnieuw." });
  }
};
