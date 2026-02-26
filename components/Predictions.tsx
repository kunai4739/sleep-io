'use client';

import { useEffect, useState } from 'react';

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

export default function Predictions({ logs }: { logs: SleepLog[] }) {
  const [prediction, setPrediction] = useState<number | null>(null);
  const [topFactors, setTopFactors] = useState<string[]>([]);

  useEffect(() => {
    if (logs.length >= 5) {
      makePrediction();
    }
  }, [logs]);

  const makePrediction = () => {
    // Simple average-based prediction (no TensorFlow complexity)
    const recentLogs = logs.slice(-7);
    const avgQuality = recentLogs.reduce((sum, log) => sum + log.quality, 0) / recentLogs.length;
    
    // Adjust based on last entry
    const lastLog = logs[logs.length - 1];
    let adjustedPrediction = avgQuality;
    
    if (lastLog.caffeine) adjustedPrediction -= 5;
    if (!lastLog.exercise) adjustedPrediction -= 3;
    if (lastLog.screens) adjustedPrediction -= 4;
    if (lastLog.duration < 7) adjustedPrediction -= 8;
    
    const parseTime = (time: string): number => {
      const [hours] = time.split(':').map(Number);
      return hours;
    };
    
    if (parseTime(lastLog.bedtime) > 23) adjustedPrediction -= 5;
    
    const finalPrediction = Math.max(0, Math.min(100, Math.round(adjustedPrediction)));
    setPrediction(finalPrediction);

    // Determine top factors
    const factors = [];
    if (lastLog.caffeine) factors.push('☕ Caffeine late in day');
    if (!lastLog.exercise) factors.push('💪 No exercise today');
    if (lastLog.screens) factors.push('📱 Screen time before bed');
    if (parseTime(lastLog.bedtime) > 23) factors.push('🕐 Late bedtime (after 11 PM)');
    if (lastLog.duration < 7) factors.push('⏰ Short sleep duration (< 7 hours)');

    setTopFactors(factors.slice(0, 3));
  };

  if (logs.length < 5) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">Not enough data yet</p>
          <p className="text-sm">Log at least 5 nights of sleep to see predictions</p>
          <p className="text-sm text-gray-300 mt-2">Current: {logs.length}/5</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">AI Sleep Predictions</h2>

      {/* Prediction Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-8 text-white mb-6">
        <div className="text-sm uppercase tracking-wide mb-2">Tomorrow&apos;s Predicted Sleep Quality</div>
        <div className="text-6xl font-bold mb-4">{prediction}/100</div>
        <div className="text-sm opacity-90">
          Based on your sleep patterns and habits
        </div>
      </div>

      {/* Top Factors */}
      {topFactors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Factors Affecting Your Sleep</h3>
          <div className="space-y-3">
            {topFactors.map((factor, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">{index + 1}.</div>
                <div className="text-gray-700">{factor}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">Aim for 7-9 hours of sleep per night</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">Avoid caffeine after 2 PM</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">Exercise regularly, but not right before bed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">Reduce screen time 1 hour before sleep</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">Keep a consistent sleep schedule</span>
          </li>
        </ul>
      </div>
    </div>
  );
}