import React, { useState } from 'react';

const GEMINI_API_KEY = 'AIzaSyB_VXy2GyKiNYZR_TK9yhJPS33ycs_vfjs'; // Replace with your key

const FixMyMeal: React.FC = () => {
  const [meal, setMeal] = useState('');
  const [goal, setGoal] = useState('Weight Loss');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const promptTemplate = (meal: string, goal: string) => `
You are a personalized meal optimizer AI.

The user provides their current meal and health goal.

Goal: ${goal}
Meal: ${meal}

Your job:
1. Analyze how well this meal supports the user's goal.
2. Suggest improvements to optimize for ${goal}.
3. Be friendly, use emojis, and break suggestions into clear bullet points.
4. Keep it practical and suitable for Indian cuisine if mentioned.

Respond in under 100 words.
`;

  const handleFixMeal = async () => {
    if (!meal.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: promptTemplate(meal, goal) }],
              },
            ],
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        setFeedback(`❌ Error: ${errorData.error.message}`);
        return;
      }

      const data = await res.json();
      const geminiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      setFeedback(geminiReply || '❌ Gemini did not return a valid response.');
    } catch (error) {
      console.error('Request Error:', error);
      setFeedback('❌ Error connecting to Gemini API.');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">🍽️ Fix My Meal Optimizer</h2>

      <label className="block mb-2 text-lg font-medium text-gray-700">Select Your Goal</label>
      <select
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition duration-200"
      >
        <option value="Weight Loss">Weight Loss</option>
        <option value="Weight Gain">Weight Gain</option>
        <option value="Maintain">Maintain Balanced Diet</option>
      </select>

      <textarea
        placeholder="Enter your current meal (e.g., rice, paneer, fried roti)..."
        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        rows={5}
        value={meal}
        onChange={(e) => setMeal(e.target.value)}
      />

      <button
        onClick={handleFixMeal}
        className="mt-6 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        disabled={loading || !meal}
      >
        {loading ? 'Analyzing...' : 'Fix My Meal'}
      </button>

      {feedback && (
        <div className="mt-6 p-4 rounded-md text-gray-800 border-l-4">
          <strong className="text-lg">AI Suggestion:</strong>
          <pre
            className={`mt-2 p-4 rounded-md whitespace-pre-wrap ${
              feedback.includes('❌') ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'
            }`}
            style={{ wordBreak: 'break-word' }}
          >
            {feedback}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FixMyMeal;
