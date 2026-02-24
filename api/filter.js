const { ApifyClient } = require('apify-client');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.APIFY_TOKEN;
    const actorId = 'novi/whatsapp-number-checker';  // नया एक्टर

    if (!token) {
        return res.status(500).json({ error: 'APIFY_TOKEN environment variable not set' });
    }

    const { phoneNumbers } = req.body;
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({ error: 'phoneNumbers must be a non-empty array' });
    }

    const client = new ApifyClient({ token });

    // novi/whatsapp-number-checker का इनपुट फॉर्मेट
    const actorInput = {
        phoneNumbers: phoneNumbers,  // यह फील्ड जरूरी है
    };

    try {
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
