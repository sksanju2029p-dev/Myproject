// api/filter.js - सीधे REST API से Apify एक्टर चलाएं
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

    // यहाँ एक्टर आईडी बदल सकते हैं (नीचे देखें)
    const actorId = 'novi/whatsapp-number-checker';  // नया एक्टर (free ट्रायल है)
    // अगर पुराना एक्टर चाहिए तो: 'wilcode/whatsapp-number-filter-pro'

    try {
        // 1. एक्टर रन स्टार्ट करें
        const startRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumbers })  // इनपुट फॉर्मेट एक्टर के हिसाब से
        });

        if (!startRes.ok) {
            const errText = await startRes.text();
            throw new Error(`Actor start failed: ${errText}`);
        }

        const startData = await startRes.json();
        const runId = startData.data.id;

        // 2. रन खत्म होने का इंतजार करें (5 सेकंड का वेट, बड़ी लिस्ट के लिए बढ़ा सकते हैं)
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 3. डिफॉल्ट डेटासेट से रिजल्ट लें
        const datasetRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?token=${token}`);
        if (!datasetRes.ok) {
            throw new Error('Failed to fetch dataset');
        }

        const items = await datasetRes.json();

        // 4. क्लाइंट को रिजल्ट भेजें
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
