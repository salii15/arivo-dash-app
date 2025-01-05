import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { products } = req.body;
    const imageAnalysisPromises = products.map(async (product: any) => {
      if (!product.image_url) return null;
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Become a 3D modeling expert. Make a quote for 3D modeling service for the product in the picture. Rate products by complexity on a scale of 1-5 and price between $25-$250. Let the output be like this as json: {\"product-id-1\": 150, \"product-id-2\": 75}"
              },
              {
                type: "image_url",
                image_url: {
                  url: product.image_url,
                  detail: "high"  // Changed to high for better analysis
                }
              },
            ],
          },
        ],
        max_tokens: 300,  // Increased token limit for more detailed analysis
      });

      return {
        productName: product.title || product.name,
        analysis: response.choices[0].message.content,
      };
    });

    const analysisResults = await Promise.all(imageAnalysisPromises);

    // Tahminleri işle ve yanıt formatını hazırla
    const estimates: Record<string, number> = {};
    analysisResults.forEach((result) => {
      if (result) {
        // AI yanıtından sayısal değeri çıkar (basit bir regex ile)
        const match = result.analysis.match(/\$?(\d{1,3}(,\d{3})*(\.\d{2})?)/);
        if (match) {
          // Virgülleri kaldır ve sayıya çevir
          const estimatedValue = parseFloat(match[1].replace(/,/g, ''));
          estimates[result.productName] = estimatedValue;
        }
      }
    });

    // Toplam tahmini bütçeyi hesapla
    const totalBudget = Object.values(estimates).reduce((sum, value) => sum + value, 0);

    return res.status(200).json({
      success: true,
      estimates,
      totalBudget,
      detailedAnalysis: analysisResults
    });

  } catch (error) {
    console.error('Error processing images:', error);
    return res.status(500).json({
      success: false,
      error: 'Image analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}