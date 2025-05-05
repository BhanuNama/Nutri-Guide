import React from 'react';

interface DietPlanSidebarProps {
  planDuration: number;
  selectedDay: number;
  onDaySelect: (day: number) => void;
}

const DietPlanSidebar: React.FC<DietPlanSidebarProps> = ({
  planDuration,
  selectedDay,
  onDaySelect
}) => {
  // Generate an array of day numbers [1, 2, 3, ..., planDuration]
  const days = Array.from({ length: planDuration }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full lg:w-64">
      <h3 className="font-semibold text-lg mb-4 border-b pb-2">Your Meal Plan</h3>
      
      <div className="space-y-2">
        {days.map(day => (
          <button
            key={day}
            onClick={() => onDaySelect(day)}
            className={`w-full text-left px-4 py-2 rounded-md transition ${
              selectedDay === day
                ? 'bg-green-600 text-white'
                : 'hover:bg-green-50 text-gray-700'
            }`}
          >
            Day {day}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DietPlanSidebar; 