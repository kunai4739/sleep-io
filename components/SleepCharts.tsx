'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

export default function SleepCharts({ logs }: { logs: SleepLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">No sleep data yet</p>
          <p className="text-sm">Log your sleep in the Chat tab to see charts</p>
        </div>
      </div>
    );
  }

  // Sort logs by date
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare data for charts
  const chartData = sortedLogs.map(log => ({
    date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    duration: log.duration,
    quality: log.quality,
  }));

  // Calculate averages
  const avgDuration = (logs.reduce((sum, log) => sum + log.duration, 0) / logs.length).toFixed(1);
  const avgQuality = (logs.reduce((sum, log) => sum + log.quality, 0) / logs.length).toFixed(0);

  // Weekly report
  const last7Days = sortedLogs.slice(-7);
  const prev7Days = sortedLogs.slice(-14, -7);
  
  const last7Avg = last7Days.length > 0 
    ? last7Days.reduce((sum, log) => sum + log.duration, 0) / last7Days.length 
    : 0;
  const prev7Avg = prev7Days.length > 0 
    ? prev7Days.reduce((sum, log) => sum + log.duration, 0) / prev7Days.length 
    : last7Avg;
  
  const durationChange = ((last7Avg - prev7Avg) * 60).toFixed(0); // in minutes

  return (
    <div className="h-full overflow-y-auto p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Sleep Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Average Sleep Duration</div>
          <div className="text-3xl font-bold text-orange-500">{avgDuration}h</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Average Quality</div>
          <div className="text-3xl font-bold text-orange-500">{avgQuality}/100</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Weekly Trend</div>
          <div className={`text-3xl font-bold ${Number(durationChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {Number(durationChange) >= 0 ? '+' : ''}{durationChange} min
          </div>
          <div className="text-xs text-gray-400 mt-1">vs previous week</div>
        </div>
      </div>

      {/* Sleep Duration Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sleep Duration Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="duration" stroke="#f97316" strokeWidth={2} name="Duration (hours)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep Quality Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sleep Quality Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} label={{ value: 'Quality (0-100)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="quality" fill="#f97316" name="Quality Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}