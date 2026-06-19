import React, { useEffect, useState } from 'react';
import { Shield, Cpu, Activity, Info, Server, Sparkles } from 'lucide-react';

interface HealthData {
  status: string;
  timestamp: string;
  apiKeysLoaded: {
    gemini: boolean;
    virustotal: boolean;
  };
}

export default function RadarHeader() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch (err) {
        console.error('Failed to contact safety monitor:', err);
      } finally {
        setLoading(false);
      }
    }
    
    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Poll health status
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-50 shadow-xs" id="radar-header">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-indigo-150 transform transition hover:scale-105 border border-slate-200/65 flex-shrink-0">
          <img 
            src="/src/assets/images/security_logo_1781452802058.jpg" 
            alt="Backspace AI Radar Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-display font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Backspace<span className="text-indigo-600 font-semibold">AI</span>
            <span className="text-[10px] uppercase font-mono tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-full font-bold ml-1">
              Active Radar v3.5
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-550 hidden sm:block font-medium">Deep Security Intelligence & Exposure Tracer</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono">
        {/* API connection indicator */}
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">Querying Core...</span>
          ) : (
            <div className="px-3.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-full flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {health?.apiKeysLoaded?.virustotal ? 'API: INTEGRATED' : 'HYBRID SCAN ACTIVE'}
            </div>
          )}
        </div>
        
        {/* Engine mode display */}
        <div className="bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs hidden md:flex items-center gap-1.5 font-medium">
          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
          <span>Gemini-3.5 Flash Gateway</span>
        </div>
      </div>
    </header>
  );
}
