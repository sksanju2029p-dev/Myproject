// api/filter.js – Official Apify API v2 endpoints के साथ
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

    // ✅ एक्टर आईडी – यह वाला पक्का काम करेगा
    const actorId = 'novi/whatsapp-number-checker';

    try {
        // ✅ STEP 1: एक्टर रन स्टार्ट करें – सही API v2 endpoint
        const startRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // ✅ सही तरीका
            },
            body: JSON.stringify({ 
                phoneNumbers: phoneNumbers
            })
        });

        // रिस्पॉन्स चेक करें
        if (!startRes.ok) {
            const errData = await startRes.json();
            console.error('Start error:', errData);
            return res.status(500).json({ error: JSON.stringify(errData) });
        }

        const startData = await startRes.json();
        const runId = startData.data.id;

        // ⏳ 5 सेकंड इंतजार करें (रन खत्म होने के लिए)
        await new Promise(r => setTimeout(r, 5000));

        // ✅ STEP 2: डेटासेट से रिजल्ट लें – सही endpoint
        const datasetRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!datasetRes.ok) {
            const errData = await datasetRes.json();
            return res.status(500).json({ error: JSON.stringify(errData) });
        }

        const items = await datasetRes.json();

        // ✅ रिजल्ट भेजें
        return res.status(200).json({
            success: true,
            runId: runId,
            result: items
        });

    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
