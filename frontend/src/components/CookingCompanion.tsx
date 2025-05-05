import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { FaClock, FaCheckCircle } from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend);

const GEMINI_API_KEY = 'AIzaSyBuY56JkWOixucZow6Dk2PJ4wrxpz_hWig';

const CookingCompanion: React.FC = () => {
  const [ingredients, setIngredients] = useState('');
  const [goal, setGoal] = useState('Weight Loss');
  const [allergies, setAllergies] = useState('');
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timers, setTimers] = useState<{ [key: number]: number }>({});
  const [completed, setCompleted] = useState<{ [key: number]: boolean }>({});

  const handleCook = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    setResponseData(null);
    setTimers({});
    setCompleted({});

    const prompt = `
You are a Cooking Companion bot.

User has ingredients: "${ingredients}" and wants to achieve: "${goal}". The user is allergic to: "${allergies}".

Return a JSON with:
{
  "recipe": [
    {
      "step": "Chop the vegetables",
      "time": 5 (in minutes)
    },
    ...
  ],
  "summary": "A balanced protein-rich recipe...",
  "macros": { "protein": 30, "carbs": 50, "fats": 15 },
  "calories": 500,
  "difficulty": "Medium",
  "total_time": 35,
  "goal_alignment": "This recipe supports weight loss by being high in protein and low in fats."
}

Only return JSON.
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

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonText = text?.match(/```json([\s\S]*?)```/)?.[1] || text;
      const parsed = JSON.parse(jsonText.trim());

      setResponseData(parsed);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch recipe from Gemini.');
    }

    setLoading(false);
  };

  const startTimer = (index: number, minutes: number) => {
    setTimers(prev => ({ ...prev, [index]: minutes * 60 }));

    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        if (updated[index] > 1) {
          updated[index] -= 1;
        } else {
          clearInterval(interval);
          updated[index] = 0;
          setCompleted(c => ({ ...c, [index]: true }));
        }
        return updated;
      });
    }, 1000);
  };

  const endStep = (index: number) => {
    setCompleted(prev => ({ ...prev, [index]: true }));
    setTimers(prev => ({ ...prev, [index]: 0 }));
  };

  const pieData = responseData ? {
    labels: ['Protein', 'Carbs', 'Fats'],
    datasets: [
      {
        data: [
          responseData.macros.protein,
          responseData.macros.carbs,
          responseData.macros.fats,
        ],
        backgroundColor: ['#4ade80', '#60a5fa', '#fbbf24'],
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">👨‍🍳 Cooking Companion</h2>

      <label className="block mb-2 font-semibold">Your Goal</label>
      <select
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      >
        <option>Weight Loss</option>
        <option>Weight Gain</option>
        <option>Maintain</option>
      </select>

      <label className="block mb-2 font-semibold">Ingredients You Have</label>
      <textarea
        rows={3}
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        className="w-full p-3 mb-4 border rounded"
        placeholder="e.g. Chicken, spinach, garlic, onion"
      />

      <label className="block mb-2 font-semibold">Allergies (if any)</label>
      <input
        value={allergies}
        onChange={(e) => setAllergies(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
        placeholder="e.g. Dairy, nuts, gluten"
      />

      <button
        onClick={handleCook}
        disabled={loading}
        className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        {loading ? 'Cooking...' : 'Generate Recipe'}
      </button>

      {responseData && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-2">🍲 Recipe Steps</h3>
          {responseData.recipe.map((step: any, index: number) => (
            <div key={index} className="flex items-start mb-3 p-3 border rounded-lg shadow-sm bg-gray-50">
              <input
                type="checkbox"
                className="mr-3 mt-1"
                checked={completed[index] || false}
                readOnly
              />
              <div className="flex-1">
                <p className="font-semibold">{`Step ${index + 1}:`} {step.step}</p>
                <p className="text-sm text-gray-600 flex items-center">
                  <FaClock className="mr-1" /> {step.time} min
                </p>
              </div>
              {!completed[index] && (
                <div className="ml-4 flex gap-2">
                  {!timers[index] && (
                    <button
                      onClick={() => startTimer(index, step.time)}
                      className="text-sm px-2 py-1 bg-blue-500 text-white rounded"
                    >
                      Start
                    </button>
                  )}
                  {timers[index] > 0 && (
                    <div className="text-sm text-blue-700 font-semibold">
                      {Math.floor(timers[index] / 60)}:{String(timers[index] % 60).padStart(2, '0')}
                    </div>
                  )}
                  <button
                    onClick={() => endStep(index)}
                    className="text-sm px-2 py-1 bg-gray-300 rounded"
                  >
                    End
                  </button>
                </div>
              )}
              {completed[index] && (
                <FaCheckCircle className="ml-3 text-green-500 mt-1" />
              )}
            </div>
          ))}

          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">⚖️ Nutritional Breakdown</h4>
            <p>Calories: {responseData.calories}</p>
            <Pie data={pieData} className="max-w-xs mt-4" />
          </div>

          <div className="mt-6">
            <h4 className="font-semibold mb-1">📈 Goal Alignment</h4>
            <p>{responseData.goal_alignment}</p>
          </div>

          <div className="mt-4">
            <p><strong>🕒 Total Time:</strong> {responseData.total_time} minutes</p>
            <p><strong>💪 Difficulty:</strong> {responseData.difficulty}</p>
          </div>

          <div className="mt-6 bg-yellow-50 p-4 rounded border">
            <h4 className="font-semibold mb-1">📋 Summary</h4>
            <p>{responseData.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookingCompanion;
