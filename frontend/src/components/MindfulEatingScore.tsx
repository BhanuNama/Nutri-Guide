import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const GEMINI_API_KEY = 'AIzaSyBuY56JkWOixucZow6Dk2PJ4wrxpz_hWig'
const MindfulEatingScore: React.FC = () => {
  const [meal, setMeal] = useState('');
  const [goal, setGoal] = useState('Weight Loss');
  const [responseData, setResponseData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!meal.trim()) return;
    setLoading(true);
    setError(null);
    setResponseData(null);

    // Process the meal input into a structured format
    const prompt = `
      You are a meal evaluation assistant.

      Given a user's meal and fitness goal, analyze and return a JSON object:
      {
        "score": number (0-100),
        "macros": {
          "protein": number,
          "carbs": number,
          "fats": number
        },
        "suggestions": {
          "donts": [string],
          "dos": [string],
          "best": [string]
        },
        "summary": string
      }

      User goal: ${goal}
      Meal: ${meal}

      Process the meal description, break it down into individual ingredients and their quantities, and analyze the meal's nutritional values accordingly.

      Respond with only valid JSON.
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
      console.error('Error analyzing meal:', err);
      setError('❌ Failed to analyze your meal');
    }

    setLoading(false);
  };

  const barData = {
    labels: ['Protein', 'Carbs', 'Fats'],
    datasets: [
      {
        label: 'Macronutrients',
        data: responseData ? [
          responseData.macros.protein,
          responseData.macros.carbs,
          responseData.macros.fats,
        ] : [0, 0, 0],
        backgroundColor: ['#4ade80', '#60a5fa', '#fbbf24'],
        borderColor: ['#4ade80', '#60a5fa', '#fbbf24'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.raw.toFixed(1)}g`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
        },
      },
    },
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">🧠 Mindful Eating Score</h2>

      <label className="block mb-2 font-medium text-gray-700">Goal</label>
      <select
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="w-full mb-4 p-2 border border-gray-300 rounded-lg"
      >
        <option value="Weight Loss">Weight Loss</option>
        <option value="Weight Gain">Weight Gain</option>
        <option value="Maintain">Maintain</option>
      </select>

      <textarea
        placeholder="What did you eat today?"
        value={meal}
        onChange={(e) => setMeal(e.target.value)}
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        {loading ? 'Analyzing...' : 'Analyze Meal'}
      </button>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {responseData && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">🍽️ Summary</h3>
          <p className="mb-4">{responseData.summary}</p>

          <div className="mb-6" style={{ height: '250px' }}>
            <h4 className="text-md font-semibold mb-2">📊 Macronutrient Breakdown</h4>
            <Bar data={barData} options={options} />
          </div>

          <div className="mt-4">
            <h4 className="font-bold text-gray-700 mb-1">🏆 Mindful Eating Score</h4>
            <p className="text-xl font-semibold">{responseData.score}/100</p>
          </div>

          <div className="mb-3 p-3 bg-green-100 border-l-4 border-green-500 rounded">
            <h4 className="font-bold text-green-700 mb-1">✅ Best Choices</h4>
            <ul className="list-disc list-inside text-green-800">
              {responseData?.suggestions?.best?.length
                ? responseData.suggestions.best.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))
                : <li>No suggestions for 'Best Choices'.</li>
              }
            </ul>
          </div>

          <div className="mb-3 p-3 bg-red-100 border-l-4 border-red-500 rounded">
            <h4 className="font-bold text-red-700 mb-1">❌ Don'ts</h4>
            <ul className="list-disc list-inside text-red-800">
              {responseData?.suggestions?.donts?.length
                ? responseData.suggestions.donts.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))
                : <li>No suggestions for 'Don'ts'.</li>
              }
            </ul>
          </div>

          <div className="mb-3 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded">
            <h4 className="font-bold text-yellow-700 mb-1">⚠️ Do’s</h4>
            <ul className="list-disc list-inside text-yellow-800">
              {responseData?.suggestions?.dos?.length
                ? responseData.suggestions.dos.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))
                : <li>No suggestions for 'Do’s'.</li>
              }
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindfulEatingScore;
