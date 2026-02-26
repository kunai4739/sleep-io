'use client';

import { Trash2 } from 'lucide-react';

type SleepLog = {
  id: string;
  date: string;
  duration: number;
  bedtime: string;
  wake: string;
  quality: number;
  caffeine: boolean;
  exercise: boolean;
  screens: boolean;
};

export default function SleepHistory({ logs, onDelete }: { logs: SleepLog[]; onDelete: (id: string) => void }) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">No sleep logs yet</p>
          <p className="text-sm">Start logging your sleep in the Chat tab</p>
        </div>
      </div>
    );
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sleep History</h2>

      <div className="space-y-4">
        {sortedLogs.map((log) => (
          <div key={log.id} className="bg-white rounded-lg shadow p-6 relative">
            <button
              onClick={() => onDelete(log.id)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete log"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-800">
                {new Date(log.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Bedtime</div>
                <div className="text-lg font-medium text-gray-800">{log.bedtime}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Wake Time</div>
                <div className="text-lg font-medium text-gray-800">{log.wake}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div className="text-lg font-medium text-gray-800">{log.duration}h</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Quality</div>
                <div className="text-lg font-medium text-orange-500">{log.quality}/100</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {log.caffeine && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                  ☕ Caffeine
                </span>
              )}
              {log.exercise && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  💪 Exercise
                </span>
              )}
              {log.screens && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  📱 Screen Time
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}