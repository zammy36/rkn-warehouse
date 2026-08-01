const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { base64, mediaType } = JSON.parse(event.body);

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `Extract data from this Odoo picking operations PDF. Return ONLY valid JSON, no markdown, no explanation.

The warehouse location is "مستودع قرينا بريدة WBuraydah" or "W-Buraydah".
- If FROM contains WBuraydah → type = "OUT" (LOAD)
- If TO contains WBuraydah → type = "IN" (UNLOAD)

Return this exact format:
{
  "transaction_no": "SM-10/INT/00005",
  "date": "2025-07-03T01:19:49",
  "type": "OUT",
  "from_location": "مستودع قرينا بريدة W-Buraydah",
  "to_location": "destination name",
  "products": [
    {"code": "10002", "name": "B.Rose (Yellow)", "name_ar": "بيبي جوري أصفر", "quantity": 70, "unit": "Piece"}
  ]
}`
          }
        ]
      }]
    });

    const text = response.content.map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(parsed)
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
