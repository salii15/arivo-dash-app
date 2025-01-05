import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// API key'in var olduğundan emin olalım
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface Product {
  id: string;
  name: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { products }: { products: Product[] } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty products array' });
    }

    const prompt = `Sen bir 3D modelleme uzmanısın ve ürünlerin 3D modellemesi için fiyat tahmini yapıyorsun.
Her ürünü karmaşıklığına göre değerlendir ve modellemesi için uygun fiyat belirle.

Ürünler:
${products.map(p => `- ${p.name}`).join('\n')}

Talimatlar:
1. Her ürün için önce karmaşıklık seviyesi belirle (1-5 arası, 5 en karmaşık)
2. Karmaşıklık seviyesine göre fiyat belirle:
   - Seviye 1: $25-$50 (basit geometrik şekiller)
   - Seviye 2: $50-$100 (temel ev aletleri)
   - Seviye 3: $100-$150 (orta karmaşıklıkta mekanik parçalar)
   - Seviye 4: $150-$200 (detaylı mekanik sistemler)
   - Seviye 5: $200-$250 (çok detaylı, karmaşık sistemler)
3. Fiyatlar USD cinsinden olmalı
4. Yanıtı sadece JSON formatında ver, her ürün ID'si için bir fiyat belirle

Değerlendirme kriterleri:
- Geometrik karmaşıklık
- Detay seviyesi
- Hareketli parça sayısı
- Yüzey detayları
- Tekstür gereksinimleri

Yanıt formatı:
{
  "ürün-id-1": 150,
  "ürün-id-2": 75
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content in response');
    
    const estimates = JSON.parse(content);
    return res.status(200).json({ estimates });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 