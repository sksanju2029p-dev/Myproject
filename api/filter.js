const { ApifyClient } = require('apify-client');

export default async function handler(req, res) {
    // सिर्फ POST method allow करें
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Environment variables लें
    const token = process.env.APIFY_TOKEN;
    const actorId = 'wilcode/whatsapp-number-filter-pro';

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

    // Actor के लिए input तैयार करें
    const actorInput = {
        phoneNumberList: phoneNumbers,
        sessionId: `whatsapp-filter-session-${Date.now()}`,
        proxySettings: {
            useApifyProxy: true,
            apifyProxyGroups: ["RESIDENTIAL"],
            apifyProxyCountry: "IN"
        }
    };

    try {
        // Actor को call करें
        const run = await client.actor(actorId).call(actorInput);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        return res.status(200).json({
            success: true,
            runId: run.id,
            result: items,
        });
    } catch (error) {
        console.error('Apify error:', error);
        return res.status(500).json({ error: error.message });
    }
}
