import { useEffect, useState } from 'react';

const quotes = [
  "Eat for the body you want, not the body you have.",
  "Believe in yourself.",
  "Keep pushing forward.",
  "You are stronger than you think.",
  "Every day is a fresh start.",
  "Hustle in silence. Let success make the noise.",
  "Dream it. Wish it. Do it.",
  "Your body can stand almost anything. It’s your mind you have to convince.",
"Don’t count the days, make the days count.",

"Success doesn’t come from what you do occasionally. It comes from what you do consistently.",

"Discipline is choosing between what you want now and what you want most.",
];

export default function MotivationalQuotes() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (visible) {
      // Visible for 20 seconds
      timer = setTimeout(() => setVisible(false), 20000);
    } else {
      // Hidden for 10 seconds, then show next quote
      timer = setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        setVisible(true);
      }, 10000);
    }

    return () => clearTimeout(timer);
  }, [visible]);

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-2xl shadow-lg z-50 max-w-xl w-[90%]">
      <div className="relative flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-2 top-1 text-gray-500 hover:text-red-500 text-lg font-bold"
        >
          ✕
        </button>
        {/* Quote */}
        <p className="text-center text-lg italic font-semibold px-4">{quotes[index]}</p>
      </div>
    </div>
  );
}
