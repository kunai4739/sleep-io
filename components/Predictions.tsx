'use client';
import type * as tf from '@tensorflow/tfjs';
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

type ModelStatus = 'idle' | 'loading' | 'training' | 'ready' | 'error';

export default function Predictions({ logs }: { logs: SleepLog[] }) {
  const [prediction, setPrediction] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [topFactors, setTopFactors] = useState<{ factor: string; impact: number }[]>([]);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (logs.length >= 5) {
      trainAndPredict();
    }
  }, [logs]);

  const parseTime = (time: string): number => {
    if (!time) return 23;
    const [hours, minutes] = time.split(':').map(Number);
    return hours + (minutes || 0) / 60;
  };

  const extractFeatures = (log: SleepLog): number[] => {
    const bedHour = parseTime(log.bedtime);
    const normalizedBedtime = bedHour > 12 ? bedHour - 12 : bedHour + 12;
    return [
      log.duration / 12,
      normalizedBedtime / 24,
      log.caffeine ? 1 : 0,
      log.exercise ? 1 : 0,
      log.screens ? 1 : 0,
    ];
  };

  const trainAndPredict = async () => {
    try {
      setModelStatus('loading');
      setTrainingProgress(0);

      const tf = await import('@tensorflow/tfjs');
      setModelStatus('training');

      const featureData = logs.map(extractFeatures);
      const labelData = logs.map(log => log.quality / 100);

      const xs = tf.tensor2d(featureData);
      const ys = tf.tensor1d(labelData);

      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [5], units: 16, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' }),
        ],
      });

      model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'meanSquaredError',
        metrics: ['mae'],
      });

      const totalEpochs = 100;
      await model.fit(xs, ys, {
        epochs: totalEpochs,
        batchSize: Math.min(8, logs.length),
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch) => {
            setTrainingProgress(Math.round(((epoch + 1) / totalEpochs) * 100));
          },
        },
      });

      // Predict on last log's features
      const lastLog = logs[logs.length - 1];
      const lastFeatures = extractFeatures(lastLog);
      const inputTensor = tf.tensor2d([lastFeatures]);
      const predictionTensor = model.predict(inputTensor) as tf.Tensor;
      const predictionValue = (await predictionTensor.data())[0];
      const finalPrediction = Math.round(predictionValue * 100);

      // Calculate confidence based on training data variance
      const qualities = logs.map(l => l.quality);
      const mean = qualities.reduce((a, b) => a + b, 0) / qualities.length;
      const variance = qualities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / qualities.length;
      const stdDev = Math.sqrt(variance);
      const confidenceScore = Math.max(40, Math.min(95, Math.round(100 - stdDev)));

      setPrediction(finalPrediction);
      setConfidence(confidenceScore);

      // Feature importance via permutation
      const baselinePred = predictionValue;
      const factors: { factor: string; impact: number }[] = [];

      const featureNames = [
        { name: '⏱️ Sleep Duration', index: 0 },
        { name: '🛏️ Bedtime', index: 1 },
        { name: '☕ Caffeine', index: 2 },
        { name: '💪 Exercise', index: 3 },
        { name: '📱 Screen Time', index: 4 },
      ];

      for (const { name, index } of featureNames) {
        const permuted = [...lastFeatures];
        permuted[index] = 1 - permuted[index];
        const permTensor = tf.tensor2d([permuted]);
        const permPred = (model.predict(permTensor) as tf.Tensor);
        const permValue = (await permPred.data())[0];
        const impact = Math.abs(baselinePred - permValue) * 100;
        factors.push({ factor: name, impact: Math.round(impact) });
        permTensor.dispose();
        permPred.dispose();
      }

      factors.sort((a, b) => b.impact - a.impact);
      setTopFactors(factors.slice(0, 4));

      // Generate insights
      const newInsights: string[] = [];
      const avgDuration = logs.reduce((s, l) => s + l.duration, 0) / logs.length;
      const caffeineNights = logs.filter(l => l.caffeine).length;
      const exerciseNights = logs.filter(l => l.exercise).length;
      const screenNights = logs.filter(l => l.screens).length;

      if (avgDuration < 7) newInsights.push(`📊 Your average sleep is ${avgDuration.toFixed(1)}h — below the 7-9h recommended range.`);
      if (caffeineNights / logs.length > 0.5) newInsights.push('☕ You have caffeine late in the day more than 50% of nights — this is likely hurting your sleep.');
      if (exerciseNights / logs.length < 0.3) newInsights.push('💪 You only exercise on ' + Math.round(exerciseNights / logs.length * 100) + '% of days — more movement could boost your sleep quality.');
      if (screenNights / logs.length > 0.6) newInsights.push('📱 Screens before bed on ' + Math.round(screenNights / logs.length * 100) + '% of nights — try cutting off 1 hour before sleep.');
      if (newInsights.length === 0) newInsights.push('✅ Your sleep habits look good! Keep maintaining your routine.');

      setInsights(newInsights);

      // Cleanup tensors
      xs.dispose();
      ys.dispose();
      inputTensor.dispose();
      predictionTensor.dispose();

      setModelStatus('ready');
    } catch (err) {
      console.error('TensorFlow error:', err);
      setModelStatus('error');
    }
  };

  const getPredictionColor = (score: number) => {
    if (score >= 75) return 'from-violet-600 to-purple-700';
    if (score >= 50) return 'from-blue-500 to-violet-600';
    return 'from-red-500 to-violet-600';
  };

  const getPredictionLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  if (logs.length < 5) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a1a2e]">
        <div className="text-center text-violet-300">
          <div className="text-6xl mb-4">🧠</div>
          <p className="text-lg mb-2 text-violet-200">Not enough data to train the model</p>
          <p className="text-sm text-violet-400">Log at least 5 nights of sleep to activate AI predictions</p>
          <div className="mt-6 bg-[#16213e] rounded-full h-3 w-64 mx-auto border border-violet-800">
            <div
              className="bg-violet-600 h-3 rounded-full transition-all"
              style={{ width: `${(logs.length / 5) * 100}%` }}
            />
          </div>
          <p className="text-sm text-violet-400 mt-2">{logs.length}/5 nights logged</p>
        </div>
      </div>
    );
  }

  if (modelStatus === 'loading' || modelStatus === 'training') {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a1a2e]">
        <div className="text-center text-violet-300">
          <div className="text-5xl mb-4 animate-pulse">🧠</div>
          <p className="text-lg text-violet-200 mb-2">
            {modelStatus === 'loading' ? 'Loading TensorFlow.js...' : 'Training neural network on your sleep data...'}
          </p>
          <div className="mt-4 bg-[#16213e] rounded-full h-3 w-64 mx-auto border border-violet-800">
            <div
              className="bg-violet-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${trainingProgress}%` }}
            />
          </div>
          <p className="text-sm text-violet-400 mt-2">{trainingProgress}% complete</p>
        </div>
      </div>
    );
  }

  if (modelStatus === 'error') {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a1a2e]">
        <div className="text-center text-violet-300">
          <p className="text-lg text-red-400">Failed to train model. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto bg-[#1a1a2e]">
      <h2 className="text-2xl font-bold text-violet-100 mb-2">AI Sleep Predictions</h2>
      <p className="text-violet-400 text-sm mb-6">Neural network trained on your {logs.length} sleep entries</p>

      {/* Prediction Card */}
      {prediction !== null && (
        <div className={`bg-gradient-to-br ${getPredictionColor(prediction)} rounded-2xl shadow-lg p-8 text-white mb-6`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm uppercase tracking-wide opacity-80 mb-2">Tonight&apos;s Predicted Sleep Quality</div>
              <div className="text-7xl font-bold mb-1">{prediction}</div>
              <div className="text-2xl opacity-90">/100 — {getPredictionLabel(prediction)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80 mb-1">Model Confidence</div>
              <div className="text-3xl font-bold">{confidence}%</div>
              <div className="text-xs opacity-70 mt-1">Based on {logs.length} nights</div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Importance */}
      {topFactors.length > 0 && (
        <div className="bg-[#16213e] rounded-2xl border border-violet-800 p-6 mb-6">
          <h3 className="text-lg font-semibold text-violet-100 mb-4">🔬 What the Model Found Most Important</h3>
          <div className="space-y-3">
            {topFactors.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm text-violet-300 mb-1">
                  <span>{item.factor}</span>
                  <span>{item.impact}% impact</span>
                </div>
                <div className="bg-[#0f3460] rounded-full h-2">
                  <div
                    className="bg-violet-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, item.impact * 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-[#16213e] rounded-2xl border border-violet-800 p-6 mb-6">
          <h3 className="text-lg font-semibold text-violet-100 mb-4">📈 Personalized Insights</h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-[#0f3460] rounded-xl">
                <p className="text-violet-200 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-[#16213e] rounded-2xl border border-violet-800 p-6">
        <h3 className="text-lg font-semibold text-violet-100 mb-4">✅ Recommendations</h3>
        <ul className="space-y-3">
          {[
            'Aim for 7-9 hours of sleep per night',
            'Avoid caffeine after 2 PM',
            'Exercise regularly, but not right before bed',
            'Reduce screen time 1 hour before sleep',
            'Keep a consistent sleep schedule every day',
          ].map((rec, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-violet-400">✓</span>
              <span className="text-violet-200 text-sm">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}