import { useState } from 'react';
import Progress from './Progress';
import ConversationGraphs from './ConversationalGraphs';

const ProgressCombined = () => {
  const [activeComponent, setActiveComponent] = useState<'first' | 'second'>('first');

  return (
    <div className="space-y-4">
      {/* Toggle Buttons */}
      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded-lg ${activeComponent === 'first' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveComponent('first')}
        >
          Manual Plan
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${activeComponent === 'second' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveComponent('second')}
        >
          Conversation Plan
        </button>
      </div>

      {/* Component Display Area */}
      <div className="border rounded-lg p-4 min-h-[200px]">
        {activeComponent === 'first' ? (
            <Progress />
        ) : (
            <ConversationGraphs />
        )}
      </div>
    </div>
  );
};

export default ProgressCombined;