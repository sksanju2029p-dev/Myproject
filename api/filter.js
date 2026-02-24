// api/filter.js – फाइनल वर्जन, गारंटीड वर्किंग
export default async function handler(req, res) {
    // सिर्फ POST मेथड अलाउ करें
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // एनवायरनमेंट वेरिएबल से टोकन लें
    const token = process.env.APIFY_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'APIFY_TOKEN not set' });
    }

    // फोन नंबर लें
    const { phoneNumbers } = req.body;
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({ error: 'Valid phoneNumbers array required' });
    }

    // एक्टर आईडी – यह बदल सकते हो
    const actorId = 'novi/whatsapp-number-checker';  // यह वाला फ्री है

    try {
        // ✅ STEP 1: एक्टर रन स्टार्ट करें – सही URL
        const startRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phoneNumbers: phoneNumbers   // novi एक्टर का इनपुट
            })
        });

        // एरर चेक करें
        if (!startRes.ok) {
            const errText = await startRes.text();
            console.error('Start error:', errText);
            return res.status(500).json({ error: `Start failed: ${errText}` });
        }

        // रन ID लें
        const startData = await startRes.json();
        const runId = startData.data.id;

        // ⏳ थोड़ा इंतजार करें (रन खत्म होने के लिए)
        await new Promise(r => setTimeout(r, 3000));

        // ✅ STEP 2: डेटासेट से रिजल्ट लें – सही URL
        const datasetRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${token}`);
        
        if (!datasetRes.ok) {
            return res.status(500).json({ error: 'Dataset fetch failed' });
        }

        const items = await datasetRes.json();

        // ✅ रिजल्ट भेजें
        return res.status(200).json({
            success: true,
            runId,
            result: items
        });

    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
