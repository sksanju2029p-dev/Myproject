const { ApifyClient } = require('apify-client');

export default async function handler(req, res) {
    // सिर्फ POST method allow करें
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Environment variables लें (Vercel पर set करें)
    const token = process.env.APIFY_TOKEN;
    const actorId = 'wilcode/whatsapp-number-filter-pro'; // आपका चुना हुआ actor

    if (!token) {
        return res.status(500).json({ error: 'APIFY_TOKEN environment variable not set' });
    }

    // Request body से डेटा लें
    const { phoneNumbers } = req.body;
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({ error: 'phoneNumbers must be a non-empty array' });
    }

    // Apify client initialize करें
    const client = new ApifyClient({ token });

    // Actor के लिए input तैयार करें – WhatsApp Number Filter Pro के schema के अनुसार [citation:1]
    const actorInput = {
        phoneNumberList: phoneNumbers,  // यह फील्ड जरूरी है
        sessionId: `whatsapp-filter-session-${Date.now()}`, // हर बार नया session बनाएं (पुराने से बचने के लिए)
        proxySettings: {
            useApifyProxy: true,
            apifyProxyGroups: ["RESIDENTIAL"], // Residential proxy जरूरी है [citation:1]
            apifyProxyCountry: "IN" // भारत के proxy से बेहतर रिजल्ट मिलेगा
        }
    };

    try {
        // Actor को call करें और finish होने तक wait करें
        const run = await client.actor(actorId).call(actorInput);

        // Result default dataset से fetch करें
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        return res.status(200).json({
            success: true,
            runId: run.id,
            result: items, // इसमें हर नंबर की जानकारी होगी (valid/invalid)
        });
    } catch (error) {
        console.error('Apify error:', error);
        return res.status(500).json({ error: error.message });
    }
}
