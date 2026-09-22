// Vercel Serverless Function — maakt een Mollie-betaling aan voor een bestelling
const { createMollieClient } = require("@mollie/api-client");

const VERPLICHTE_KLANTVELDEN = ["voornaam", "achternaam", "straat", "postcode", "plaats", "telefoon", "email"];

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

  const { items, total, subtotal, btw, customer } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "De winkelwagen is leeg." });
  }

  const totalAmount = Number(total);
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return res.status(400).json({ error: "Het totaalbedrag is ongeldig." });
  }

  if (!customer || typeof customer !== "object") {
    return res.status(400).json({ error: "Vul je factuur- en verzendgegevens in." });
  }

  const ontbrekendVeld = VERPLICHTE_KLANTVELDEN.find(veld => !String(customer[veld] || "").trim());
  if (ontbrekendVeld) {
    return res.status(400).json({ error: "Vul al je gegevens in voordat je afrekent." });
  }

  const description =
    items.length === 1
      ? `Dr. Gift Shop bestelling — ${items[0].name || items[0].id}`
      : `Dr. Gift Shop bestelling — ${items.length} artikelen`;

  try {
    const mollieClient = createMollieClient({ apiKey });
    const origin = `https://${req.headers.host}`;
    const isSecureOrigin = origin.startsWith("https://") && !req.headers.host.includes("localhost");

    const [voornaam, achternaam] = [customer.voornaam.trim(), customer.achternaam.trim()];

    const payment = await mollieClient.payments.create({
      amount: {
        currency: "EUR",
        value: totalAmount.toFixed(2)
      },
      description,
      redirectUrl: `${origin}/bevestiging.html`,
      // Mollie accepteert alleen publiek bereikbare https-webhooks; lokaal wordt deze daarom overgeslagen.
      ...(isSecureOrigin ? { webhookUrl: `${origin}/api/webhook` } : {}),
      billingAddress: {
        givenName: voornaam,
        familyName: achternaam,
        email: customer.email.trim(),
        phone: customer.telefoon.trim(),
        streetAndNumber: customer.straat.trim(),
        postalCode: customer.postcode.trim(),
        city: customer.plaats.trim(),
        country: "NL"
      },
      metadata: {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price
        })),
        subtotaalExclBtw: subtotal,
        btw: btw,
        totaalInclBtw: total,
        klant: {
          naam: `${voornaam} ${achternaam}`,
          bedrijfsnaam: (customer.bedrijfsnaam || "").trim() || null,
          adres: `${customer.straat.trim()}, ${customer.postcode.trim()} ${customer.plaats.trim()}, ${customer.land || "Nederland"}`,
          telefoon: customer.telefoon.trim(),
          email: customer.email.trim()
        }
      }
    });

    return res.status(200).json({ checkoutUrl: payment.getCheckoutUrl() });
  } catch (error) {
    console.error("Fout bij het aanmaken van de Mollie-betaling:", error);
    return res.status(500).json({ error: "Er is iets misgegaan bij het starten van de betaling. Probeer het opnieuw." });
  }
};
