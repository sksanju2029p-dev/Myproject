// api/filter.js - सही REST API कॉल के साथ
export default async function handler(req, res) {
    // सिर्फ POST मेथड अलाउ करें
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // एनवायरनमेंट वेरिएबल से टोकन लें
    const token = process.env.APIFY_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'APIFY_TOKEN environment variable not set' });
    }

    // रिक्वेस्ट बॉडी से फोन नंबर लें
    const { phoneNumbers } = req.body;
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({ error: 'phoneNumbers must be a non-empty array' });
    }

    // ✅ सही एक्टर आईडी (novi/whatsapp-number-checker काम करेगा)
    const actorId = 'novi/whatsapp-number-checker';

    try {
        // ✅ सही URL बनाएँ (बिना किसी गलती के)
        const url = `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`;
        
        const startRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phoneNumbers: phoneNumbers  // एक्टर का इनपुट फॉर्मेट
            })
        });

        if (!startRes.ok) {
            const errText = await startRes.text();
            console.error('Apify start error:', errText);
            return res.status(500).json({ error: `Actor start failed: ${errText}` });
        }

        const startData = await startRes.json();
        const runId = startData.data.id;

        // 5 सेकंड वेट करें (रन खत्म होने का इंतजार)
        await new Promise(resolve => setTimeout(resolve, 5000));

        // ✅ डेटासेट से रिजल्ट लें
        const datasetRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${token}`);
        
        if (!datasetRes.ok) {
            return res.status(500).json({ error: 'Failed to fetch dataset' });
        }

        const items = await datasetRes.json();

        return res.status(200).json({
            success: true,
            runId,
            result: items,
        });

    } catch (error) {
        console.error('Apify API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
