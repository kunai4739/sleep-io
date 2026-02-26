'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Moon, LineChart, History, Brain } from 'lucide-react';
import SleepCharts from '../components/SleepCharts';
import SleepHistory from '../components/SleepHistory';
import Predictions from '../components/Predictions';

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

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'charts' | 'history' | 'predictions'>('chat');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sleepLogs');
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load logs:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem('sleepLogs', JSON.stringify(logs));
    }
  }, [logs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseSleepLog = (content: string): SleepLog | null => {
    const logPattern = /SLEEP_LOG:(\{[^}]*\})/;
    const match = content.match(logPattern);
    if (match) {
      try {
        const logData = JSON.parse(match[1]);
        return {
          id: Date.now().toString(),
          date: logData.date || new Date().toISOString().split('T')[0],
          bedtime: logData.bedtime,
          wake: logData.wake,
          duration: logData.duration || 0,
          quality: logData.quality || 50,
          caffeine: logData.caffeine || false,
          exercise: logData.exercise || false,
          screens: logData.screens || false,
        };
      } catch (e) {
        console.error('Failed to parse sleep log:', e);
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          logs,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Frontend received:', data);
      const assistantId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: data.content,
      }]);

      const sleepLog = parseSleepLog(data.content);
      if (sleepLog) {
        setLogs(prev => [...prev, sleepLog]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure your API key is set correctly in .env.local',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(log => log.id !== id));
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a1a2e]">
      <div className="flex items-center justify-center py-6 border-b border-violet-800 bg-[#16213e]">
        <Moon className="w-6 h-6 text-violet-400 mr-3" />
        <h1 className="text-3xl font-serif text-violet-100">Sleep.io</h1>
      </div>

      <div className="text-center text-sm text-violet-300 py-2 bg-[#16213e] border-b border-violet-800">
        Your assistant for finding the best sleep routine
      </div>

      <div className="flex justify-center gap-2 px-4 py-3 bg-[#16213e] border-b border-violet-800">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'chat' ? 'bg-violet-600 text-white' : 'bg-[#0f3460] text-violet-200 hover:bg-violet-800'
          }`}
        >
          <Send className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'charts' ? 'bg-violet-600 text-white' : 'bg-[#0f3460] text-violet-200 hover:bg-violet-800'
          }`}
        >
          <LineChart className="w-4 h-4" />
          Charts
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'history' ? 'bg-violet-600 text-white' : 'bg-[#0f3460] text-violet-200 hover:bg-violet-800'
          }`}
        >
          <History className="w-4 h-4" />
          History ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'predictions' ? 'bg-violet-600 text-white' : 'bg-[#0f3460] text-violet-200 hover:bg-violet-800'
          }`}
        >
          <Brain className="w-4 h-4" />
          Predictions
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
              {messages.length === 0 ? (
                <div className="text-center text-violet-300 mt-20">
                  <Moon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Start chatting to track your sleep and get personalized insights</p>
                  <p className="text-sm mt-2 text-violet-400">
                    Try: &quot;Log my sleep from last night - I went to bed at 11pm, woke at 7am, quality was 8/10&quot;
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const displayContent = msg.content.replace(/SLEEP_LOG:\{[^}]*\}/, '').trim();
                  return (
                    <div key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div
                        className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-violet-600 text-white'
                            : 'bg-[#16213e] text-violet-100 shadow-sm border border-violet-800'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{displayContent}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-violet-800 bg-[#16213e]">
              <div className="max-w-3xl mx-auto px-4 py-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message Sleep.io..."
                    className="flex-1 px-4 py-3 border border-violet-700 rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500 bg-[#0f3460] text-violet-100 placeholder-violet-400"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-violet-600 text-white p-3 rounded-full hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && <SleepCharts logs={logs} />}
        {activeTab === 'history' && <SleepHistory logs={logs} onDelete={deleteLog} />}
        {activeTab === 'predictions' && <Predictions logs={logs} />}
      </div>
    </div>
  );
}