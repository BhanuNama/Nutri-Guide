import React, { useState } from 'react';

const GEMINI_API_KEY = 'AIzaSyBuY56JkWOixucZow6Dk2PJ4wrxpz_hWig'; // Replace with your Gemini API key

const FoodDoctor: React.FC = () => {
  const [issue, setIssue] = useState('');
  const [responseData, setResponseData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!issue.trim()) return;
    setLoading(true);
    setError(null);
    setResponseData(null);

    const prompt = `
You are a food evaluation assistant.

Given a user's description of their health problem, identify possible nutrient deficiencies, and provide suggestions to correct these deficiencies.

Respond with a JSON object with the following fields:
{
  "deficiency": string,
  "recommended_foods": [string],
  "additional_recommendations": [string]
}

Health issue: ${issue}

Please respond with valid JSON only.
`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      const result = await res.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      const jsonText = text?.match(/```json([\s\S]*?)```/)?.[1] || text;
      const parsed = JSON.parse(jsonText.trim());

      setResponseData(parsed);
    } catch (err) {
      console.error(err);
      setError('❌ Failed to analyze your health issue');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">🩺 Food Doctor</h2>

      <label className="block mb-2 font-medium text-gray-700">Describe Your Health Issue</label>
      <textarea
        placeholder="Describe your food-related health issue (e.g., 'I feel tired all the time')"
        value={issue}
        onChange={(e) => setIssue(e.target.value)}
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        {loading ? 'Analyzing...' : 'Analyze Issue'}
      </button>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {responseData && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">🍽️ Deficiency and Recommendations</h3>

          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2">🔍 Nutrient Deficiency</h4>
            <p>{responseData.deficiency}</p>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2">🥗 Recommended Foods</h4>
            <ul className="list-disc list-inside">
              {responseData.recommended_foods.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2">💡 Additional Recommendations</h4>
            <ul className="list-disc list-inside">
              {responseData.additional_recommendations.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDoctor;
