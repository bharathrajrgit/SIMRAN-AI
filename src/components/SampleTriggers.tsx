import React from 'react';
import { Target, Globe, Hash, AlertTriangle, KeyRound, Terminal } from 'lucide-react';
import { QueryType } from '../types';

interface SampleItem {
  label: string;
  value: string;
  type: QueryType;
  description: string;
  icon: React.ReactNode;
}

interface SampleTriggersProps {
  onSelect: (value: string, type: QueryType) => void;
  disabled?: boolean;
}

export default function SampleTriggers({ onSelect, disabled }: SampleTriggersProps) {
  const samples: SampleItem[] = [
    {
      label: 'Phishing URL',
      value: 'https://secure-bank-login-update-support.xyz/login.php',
      type: 'url',
      description: 'Simulate a banking typo-squat URL',
      icon: <Globe className="w-4 h-4 text-rose-400" />
    },
    {
      label: 'Malware Domain',
      value: 'ransomware-payload-delivery.net',
      type: 'domain',
      description: 'Simulate a Command & Control delivery domain',
      icon: <Target className="w-4 h-4 text-amber-400" />
    },
    {
      label: 'Risk IP',
      value: '185.220.101.5',
      type: 'ip',
      description: 'Check active Tor Exit Node metadata',
      icon: <Terminal className="w-4 h-4 text-indigo-400" />
    },
    {
      label: 'Malicious Hash',
      value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      type: 'hash',
      description: 'Look up signature file hashes',
      icon: <Hash className="w-4 h-4 text-emerald-400" />
    }
  ];

  return (
    <div className="mt-4" id="sample-triggers-container">
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-3">
        <KeyRound className="w-4 h-4 text-indigo-500" />
        <span>Preconfigured Intelligence Samples</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {samples.map((s, idx) => (
          <button
            key={idx}
            onClick={() => !disabled && onSelect(s.value, s.type)}
            disabled={disabled}
            className={`flex flex-col items-start text-left p-4 rounded-xl border text-slate-700 relative group overflow-hidden ${
              disabled 
                ? 'opacity-55 cursor-not-allowed bg-slate-100 border-slate-200' 
                : 'cursor-pointer hover:border-indigo-400 border-slate-200 bg-white hover:shadow-lg hover:shadow-indigo-50/40 transition-all active:scale-[0.98]'
            }`}
          >
            {/* Visual colored marker */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-indigo-600 transition-all" />
            <div className="flex items-center gap-2.5 mb-1.5 pl-1.5">
              {s.icon}
              <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase font-display">
                {s.label}
              </span>
            </div>
            <div className="text-xs text-slate-600 font-mono pl-1.5 overflow-hidden text-ellipsis w-full whitespace-nowrap mb-1">
              {s.value}
            </div>
            <div className="text-xs text-slate-450 font-medium pl-1.5 leading-normal">
              {s.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
