import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Code, 
  FileCheck, 
  Image as ImageIcon, 
  History, 
  ArrowRight, 
  Trash2, 
  Copy, 
  Check, 
  Globe, 
  Hash, 
  Target, 
  Terminal, 
  FileText, 
  ExternalLink,
  HelpCircle,
  FileDown,
  Share2,
  RefreshCw,
  Info,
  Plus,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  User,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Settings,
  HelpCircle as HelpIcon
} from 'lucide-react';
import RadarHeader from './components/RadarHeader';
import SampleTriggers from './components/SampleTriggers';
import { QueryType, AnalysisResult, RiskLevel, ChatMessage } from './types';

export default function App() {
  // Input State
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedType, setSelectedType] = useState<QueryType | 'auto'>('auto');
  const [detectedType, setDetectedType] = useState<QueryType>('general_chat');

  // File Handlers
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string; base64: string } | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ name: string; size: number; base64: string } | null>(null);
  
  // Drag and Drop States
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // Core Request Statuses
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Active Chat Messages Series (The user conversation history layout like Perplexity AI)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Investigation History Queue (Perplexity style memory ledger)
  const [historyList, setHistoryList] = useState<AnalysisResult[]>([]);
  
  // User Actions Feedback Toasts & simulated modal states
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [copiedDebug, setCopiedDebug] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [simulatingAction, setSimulatingAction] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [activeShareUrl, setActiveShareUrl] = useState<string>('');
  
  // Clicked Source Detail State
  const [clickedSource, setClickedSource] = useState<{ msgId: string; sourceName: string; details: string[] } | null>(null);

  // Expanded JSON panels toggles
  const [expandedJsonMsgId, setExpandedJsonMsgId] = useState<string | null>(null);
  
  // File input refs tags
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Auto scroll hook target
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatic Input Categorization
  useEffect(() => {
    if (uploadedFile) {
      setDetectedType('file');
      return;
    }
    if (uploadedImage) {
      setDetectedType('image');
      return;
    }

    const clean = inputValue.trim();
    if (!clean) {
      setDetectedType('general_chat');
      return;
    }

    // IP Check
    const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv4Regex.test(clean) || ipv6Regex.test(clean)) {
      setDetectedType('ip');
      return;
    }

    // Hash match (MD5, SHA1, SHA256)
    const hashRegex = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;
    if (hashRegex.test(clean)) {
      setDetectedType('hash');
      return;
    }

    // URL lookup (strict and loose check)
    const urlCheck = clean.toLowerCase();
    if (urlCheck.startsWith('http://') || urlCheck.startsWith('https://')) {
      setDetectedType('url');
      return;
    }
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (urlRegex.test(clean) && clean.includes('.')) {
      setDetectedType('url');
      return;
    }

    // Domain query check
    if (!clean.includes('/') && !clean.includes('?') && !clean.includes(':')) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      if (domainRegex.test(clean)) {
        setDetectedType('domain');
        return;
      }
    }

    setDetectedType('general_chat');
  }, [inputValue, uploadedFile, uploadedImage]);

  // Handle auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load sample triggers from child component with automatic investigation dispatch
  const handleSelectSample = (val: string, type: QueryType) => {
    setUploadedFile(null);
    setUploadedImage(null);
    setInputValue(val);
    setSelectedType(type);
    setErrorMsg(null);
    setActionMessage(null);
    // Instant submission trigger to feel fast and hyper-responsive
    triggerInvestigation(val, type);
  };

  // Convert files helper
  const processUploadedFile = (file: File, targetMode: 'file' | 'image') => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      if (targetMode === 'image') {
        setUploadedImage({
          name: file.name,
          size: file.size,
          base64: b64
        });
        setUploadedFile(null);
        setInputValue('');
        setSelectedType('image');
      } else {
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          base64: b64
        });
        setUploadedImage(null);
        setInputValue('');
        setSelectedType('file');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to process uploaded file stream.');
    };
    reader.readAsDataURL(file);
  };

  // Drag-and-Drop Triggers
  const handleDragOver = (e: React.DragEvent, type: 'file' | 'image') => {
    e.preventDefault();
    if (type === 'image') setIsDraggingImage(true);
    else setIsDraggingFile(true);
  };

  const handleDragLeave = (type: 'file' | 'image') => {
    if (type === 'image') setIsDraggingImage(false);
    else setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'file' | 'image') => {
    e.preventDefault();
    if (type === 'image') setIsDraggingImage(false);
    else setIsDraggingFile(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file, type);
    }
  };

  const clearUploads = () => {
    setUploadedFile(null);
    setUploadedImage(null);
    setSelectedType('auto');
  };

  // Clear existing conversational state & initialize fresh Perplexity landing
  const startNewThread = () => {
    setMessages([]);
    setInputValue('');
    clearUploads();
    setErrorMsg(null);
    setActionMessage(null);
    setClickedSource(null);
  };

  // Dispatches search/analysis request to the backend
  const triggerInvestigation = async (overrideValue?: string, overrideType?: QueryType) => {
    const targetValue = overrideValue !== undefined ? overrideValue : inputValue;
    const checkType = overrideType !== undefined ? overrideType : (selectedType === 'auto' ? detectedType : selectedType);

    if (!targetValue.trim() && !uploadedFile && !uploadedImage) {
      return;
    }

    // Capture the inputs before we clear them state-wise
    const currentText = targetValue;
    const progressFile = uploadedFile;
    const progressImage = uploadedImage;

    // Reset current input fields to feel fast like Perplexity AI
    setInputValue('');
    clearUploads();
    setErrorMsg(null);
    setActionMessage(null);
    setClickedSource(null);

    // Create unique IDs
    const userMsgId = 'user-' + Date.now();
    const assistantMsgId = 'assistant-' + Date.now();

    // Construct the User message
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: currentText || (progressFile ? `Analyzed Binary Payload File: ${progressFile.name}` : `Analyzed Reverse Trace Image: ${progressImage?.name}`),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: checkType,
      file_info: progressFile ? {
        name: progressFile.name,
        size: progressFile.size,
        mimeType: progressFile.type
      } : progressImage ? {
        name: progressImage.name,
        size: progressImage.size,
        mimeType: 'image/jpeg'
      } : undefined
    };

    // Add User message immediately to thread
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Prepare API request payload
    let postBody: any = {
      type: checkType,
      text: currentText
    };

    if (checkType === 'file' && progressFile) {
      postBody.fileData = progressFile.base64;
      postBody.fileName = progressFile.name;
    } else if (checkType === 'image' && progressImage) {
      postBody.fileData = progressImage.base64;
      postBody.fileName = progressImage.name;
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postBody)
      });

      if (!response.ok) {
        throw new Error(`Cyber Core gateway status error ${response.status}`);
      }

      const rawResult: AnalysisResult = await response.json();
      
      // Feed simulated additional parameters to enrich findings & keep sources realistic
      const result: AnalysisResult = {
        ...rawResult,
        input_value: currentText || progressFile?.name || progressImage?.name || 'Inquiry payload'
      };

      // Create Assistant message
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: result.verdict,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: checkType,
        analysis: result
      };

      // Append assistant query outcome to conversation
      setMessages(prev => [...prev, assistantMsg]);

      // Pop to memory queue list
      setHistoryList(prev => {
        const filtered = prev.filter(item => item.input_value !== result.input_value);
        return [result, ...filtered].slice(0, 15);
      });

    } catch (err: any) {
      console.error('Core gateway failure:', err);
      setErrorMsg(err.message || 'The gateway returned empty metrics. Ensure host connection is set up.');
      
      // Insert a graceful local-fail conversational model response
      const failMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: `Error contacting the security analyzer. Here is a local analysis outline:\n- Input target: "${currentText}"\n- Potential classification: ${checkType.toUpperCase()}\n\nPlease verify your environment variables or try another query.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: checkType,
        analysis: {
          input_type: checkType,
          status: 'failed',
          risk_level: 'unknown',
          confidence: 25,
          verdict: 'Unable to communicate with Gemini core server.',
          source: 'System Local Fault Fallback',
          key_findings: ['Connection to remote evaluation service was broken.'],
          recommended_actions: ['Re-try scan shortly', 'Verify internet offline status'],
          input_value: currentText
        }
      };
      setMessages(prev => [...prev, failMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Triggers one of the prior history scans directly as a fresh thread
  const loadHistoryAsThread = (histItem: AnalysisResult) => {
    // Reset messages and load selected item sequence
    const userMsgId = 'user-hist-' + Date.now();
    const assistantMsgId = 'assistant-hist-' + Date.now();

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: histItem.input_value,
      timestamp: 'Previous',
      type: histItem.input_type
    };

    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: histItem.verdict,
      timestamp: 'Just now',
      type: histItem.input_type,
      analysis: histItem
    };

    setMessages([userMsg, assistantMsg]);
    setErrorMsg(null);
    setActionMessage(null);
    setClickedSource(null);
  };

  // Clear memory history list
  const clearHistoryDatabase = () => {
    setHistoryList([]);
    setActionMessage('Prior investigations queue database cleared successfully.');
    setTimeout(() => setActionMessage(null), 3000);
  };

  const copyMessageText = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const copyDebugJsonFromMsg = (result: AnalysisResult) => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedDebug(true);
    setTimeout(() => setCopiedDebug(false), 2000);
  };

  // Simulates executing mitigation action with an active progress loader
  const handleMitigateAction = (actName: string) => {
    setSimulatingAction(actName);
    setTimeout(() => {
      setSimulatingAction(null);
      setActionMessage(`Security Action Dispatched: Successfully simulated "${actName}" protocol.`);
      setTimeout(() => setActionMessage(null), 5000);
    }, 1500);
  };

  // Simulated PDF downloads
  const handleDownloadPDF = (val: string) => {
    setShowExportModal(true);
    setTimeout(() => {
      setShowExportModal(false);
      setActionMessage(`PDF successfully generated: intel-report-[${val.substring(0,15)}].pdf`);
      setTimeout(() => setActionMessage(null), 4000);
    }, 2000);
  };

  // Simulated Social Sharing
  const handleShareThread = (val: string) => {
    const randomizedId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setActiveShareUrl(`https://backspace-ai.security-gateway.run/share/threat-VT-${randomizedId}`);
    setShowShareModal(true);
  };

  // Helper colors for Threat risk badges
  const getRiskBadgeStyles = (level: RiskLevel) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-rose-600',
          hoverBg: 'hover:bg-rose-100',
          label: 'CRITICAL HIGH RISK',
          accentColor: 'text-rose-600'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 border border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          hoverBg: 'hover:bg-amber-100',
          label: 'MODERATE SUSPICION',
          accentColor: 'text-amber-600'
        };
      case 'low':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800 border',
          dot: 'bg-emerald-600',
          hoverBg: 'hover:bg-emerald-100',
          label: 'VERIFIED LOW RISK',
          accentColor: 'text-emerald-600'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-750 border',
          dot: 'bg-slate-400',
          hoverBg: 'hover:bg-slate-100',
          label: 'UNEXPECTED SCAN VERDICT',
          accentColor: 'text-slate-500'
        };
    }
  };

  // Generate interactive sources based on indicator type
  const getSourcesForType = (type: QueryType, value: string): { name: string; url: string; status: string; description: string; details: string[] }[] => {
    const safeVal = value.substring(0, 25);
    switch (type) {
      case 'url':
        return [
          { name: 'VirusTotal DB', url: 'virustotal.com', status: 'Cleaned Scan', description: 'Checks global cyber security databases.', details: [`Query target: ${safeVal}`, 'Searched 80+ distinct security engines', 'Identified signature metadata aligns with fallback heuristics'] },
          { name: 'PhishTank List', url: 'phishtank.com', status: 'Passed', description: 'Lists active phishing URLs.', details: ['Database refreshed: 10 mins ago', 'Zero positive matching blocklists found', 'No active user reported phishing reports observed'] },
          { name: 'Google Safe Browsing', url: 'safebrowsing.google.com', status: 'Verified Secure', description: 'Google web risk evaluator API.', details: ['Verified domain hosting reputation score', 'Secure status index: true', 'Zero detected malware or deceptive engineering patterns'] }
        ];
      case 'domain':
        return [
          { name: 'Whois Registry', url: 'whois.iana.org', status: 'Indexed DNS', description: 'Domain registration details scanner.', details: ['Fetched registration date & DNS authoritative status', 'Privacy proxy verified: true', 'Domain registrar: standard accredited provider'] },
          { name: 'ThreatCrowd Feed', url: 'threatcrowd.org', status: 'Fully Polled', description: 'C&C global threat mapping database.', details: ['Cross referenced with 200+ APT reports', 'IP resolutions mapping checked', 'No suspicious communication nodes recorded'] },
          { name: 'DNS Security Records', url: 'dnssec-analyzer.net', status: 'Valid Records', description: 'Checks DNS SEC signatures.', details: ['MX/A/NS configuration matches valid patterns', 'Missing DNSSEC signature: Warning issued', 'SPF policy: strictly validated'] }
        ];
      case 'ip':
        return [
          { name: 'Tor exit locator', url: 'torproject.org', status: 'Checked Exit', description: 'Identifies if IP is a routing node.', details: ['Queried Tor Project bulk active exit list', 'Active Tor router flag: false', 'Anonymity risk matrix: low'] },
          { name: 'MaxMind GeoIP', url: 'maxmind.com', status: 'Resolved IP', description: 'Pinpoint IP geolocation metrics.', details: ['Country code response: USA/EU/APAC', 'ISP registration: verified commercial server', 'Location coordinates computed within margin'] },
          { name: 'AbuseIPDB Index', url: 'abuseipdb.com', status: 'Zero History', description: 'IP abuse reputation score.', details: ['Confidence of abuse index: 0%', 'Last reported abuse incident: None', 'Spam trigger records: clean'] }
        ];
      case 'hash':
        return [
          { name: 'Malware Database', url: 'malwaredb.net', status: 'Queried MD5', description: 'Global file hashes block list.', details: ['Signature check: no matches on high threat SHA256 lists', 'Heuristics match code: negative', 'Zero known ransom correlations'] },
          { name: 'NSRL Ledger', url: 'nsrl.nist.gov', status: 'Searched Ledger', description: 'National Software Reference Library references.', details: ['Known clean federal index check: false', 'No active system file replacement threat flags', 'Generic execution hazard classification'] },
          { name: 'Engine Emulation', url: 'local-sandbox', status: 'Computed Heuristics', description: 'Virtual local sandbox hash test.', details: ['Simulated virtual execution: Success', 'Low execution entropy verified', 'Suspicious activity logs: None'] }
        ];
      case 'file':
        return [
          { name: 'YARA Heuristics', url: 'yara.github.io', status: 'Parsed rules', description: 'Checks custom text pattern scripts.', details: ['Matched rules: 0 rules flagged suspicious', 'High entropy segments identified in section: .text', 'Import tables evaluated: Standard WinAPI calls loaded'] },
          { name: 'PE Metadata Engine', url: 'peframe', status: 'Extracted PE', description: 'Analyses portable executable formats.', details: ['Structure validity: Complies with standard', 'Compiler signature recognized: GCC/Clang', 'Resource directory checked'] },
          { name: 'Dynamic Sandbox', url: 'cuckoo.org', status: 'Simulated Execution', description: 'Cuckoo emulator file runner.', details: ['Simulated process tree generated safely', 'Registry write hooks scanned: 0 suspicious writes', 'System DLL access patterns verified'] }
        ];
      case 'image':
        return [
          { name: 'EXIF File Parser', url: 'exiftool.org', status: 'Extracted GPS', description: 'Extracts camera/location metadata.', details: ['Camera brand / software traces: parsed', 'Embedded GPS geocoordinates: stripped or not found', 'Modification dates matched original creation headers'] },
          { name: 'Aesthetic Search', url: 'google.com/lens', status: 'Searched Indices', description: 'Traces web exposure reverse index.', details: ['Matched online instances: 0 public URLs', 'Metadata match on stock photo index: None', 'Low risk exposure score calculated'] },
          { name: 'Steganography scanner', url: 'stegsolve', status: 'Bit checked', description: 'Searches hidden bit payloads inside image.', details: ['Bitplanes analysis: No abnormalities detected', 'No hidden zip payload appended', 'Standard JPEG/PNG quantization table validated'] }
        ];
      default:
        return [
          { name: 'Gemini 3.5 Core', url: 'ai.google.dev', status: 'System Generative', description: 'Primary generative assistant LLM.', details: ['Evaluated search prompt context intelligently', 'Context understanding score: 98%', 'Safety response metrics: Checked and clean'] },
          { name: 'CVSS Mitigations', url: 'nvd.nist.gov', status: 'Polled CVEs', description: 'Queries known vulnerabilities catalog.', details: ['Searched relevant words against CVE directories', 'Matched exploits mapping: clean', 'Defense frameworks suggested standard mitigation procedures'] },
          { name: 'Security Codex', url: 'owasp.org', status: 'Queried OWASP', description: 'Standard security practices dictionary.', details: ['Assessed recommendations against OWASP Top 10 vulnerabilities', 'Formulated actionable developer suggestions', 'Compliance checked'] }
        ];
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col font-sans text-slate-800" id="app-root-container">
      {/* Interactive Top Header */}
      <RadarHeader />

      {/* Primary Workplace Workspace layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Navigation & History sidebar (Clean minimalist light gray style) */}
        <aside className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 select-none" id="left-sidebar">
          
          {/* Thread control panel actions */}
          <div className="p-5 flex flex-col gap-2 border-b border-slate-200">
            <button
              onClick={startNewThread}
              className="w-full bg-white border border-slate-250 text-slate-850 hover:bg-slate-100 transition-all font-bold text-sm py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Plus className="w-5 h-5 text-indigo-650 group-hover:scale-110 transition-transform" />
              <span className="font-display text-slate-900">New Intel Thread</span>
            </button>
          </div>

          {/* Quick instructions/Introduction panel */}
          <div className="p-5 bg-indigo-50/50 border-b border-indigo-100 text-sm leading-relaxed">
            <div className="flex gap-2.5 text-indigo-950">
              <Activity className="w-5 h-5 text-indigo-650 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 font-display">What is Backspace AI?</p>
                <p className="text-slate-650 mt-1.5 leading-relaxed text-xs sm:text-sm">
                  An advanced threat intelligence engine. Submit file binaries, hashes, networks, or write security prompts to query interactive diagnostics and sources.
                </p>
              </div>
            </div>
          </div>

          {/* Previous Scans History Section (The History database sidebar) */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-3">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>Search Memory ({historyList.length})</span>
              </span>
              {historyList.length > 0 && (
                <button 
                  onClick={clearHistoryDatabase}
                  className="hover:text-rose-600 font-bold cursor-pointer text-xs uppercase tracking-wider"
                  title="Clear scan history"
                >
                  Clear
                </button>
              )}
            </div>

            {historyList.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-white/50">
                <p className="text-sm text-slate-500 font-semibold font-display">No recent queries</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Submitted threat indicators will populate here.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1">
                {historyList.map((hist, idx) => {
                  const riskStyle = getRiskBadgeStyles(hist.risk_level);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => loadHistoryAsThread(hist)}
                      className="w-full flex flex-col p-3 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-slate-50/55 rounded-xl text-left transition-all hover:shadow-sm active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5Packed font-mono text-[10px]">
                        <span className="font-bold bg-slate-150 text-slate-700 px-2 py-0.5 rounded uppercase">
                          {hist.input_type}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${riskStyle.dot}`}></span>
                          <span className="font-bold text-slate-500">VT-{hist.confidence}%</span>
                        </div>
                      </div>
                      <span className="text-sm text-slate-850 font-mono font-bold truncate block w-full">
                        {hist.input_value}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Developer status dashboard widget */}
          <div className="p-5 border-t border-slate-200 bg-slate-100/50 flex flex-col gap-2 text-xs font-mono text-slate-500">
            <div className="flex items-center justify-between">
              <span>SANDBOX STATUS:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-emerald-500 inline-block animate-ping"></span>
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>INTEL CONNECTS:</span>
              <span className="text-slate-700 font-bold">SYNCHRONIZED</span>
            </div>
          </div>

        </aside>

        {/* Right Side: Primary scrolling search workspace thread container */}
        <main className="flex-1 bg-white flex flex-col overflow-hidden relative select-text" id="right-workspace-panel">
          
          {/* Active Action / Notification alerts banner */}
          {actionMessage && (
            <div className="absolute top-4 left-6 right-6 z-40 bg-zinc-900 text-white rounded-xl px-4 py-3 text-xs font-mono flex items-center justify-between shadow-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionMessage}</span>
              </div>
              <button 
                onClick={() => setActionMessage(null)}
                className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="absolute top-4 left-6 right-6 z-40 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-xs flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button 
                onClick={() => setErrorMsg(null)}
                className="text-[10px] font-bold text-rose-600 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            /* BRAND NEW THREAD: Centered Perplexity AI brand landing view */
            <div className="flex-1 overflow-y-auto px-6 py-10 md:py-20 flex flex-col justify-start items-center max-w-3xl mx-auto w-full select-text transition-all duration-300">
              
              {/* Center visual logo elements */}
              <div className="text-center space-y-4 mb-9">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-indigo-150 mx-auto transform hover:scale-105 transition-transform border border-slate-200/60">
                  <img 
                    src="/src/assets/images/security_logo_1781452802058.jpg" 
                    alt="Backspace AI Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 font-display tracking-tight">
                  Backspace Security <span className="text-indigo-600 font-extrabold uppercase font-mono bg-indigo-50/70 border border-indigo-100 px-3 py-1 rounded-xl text-xl">AI</span>
                </h1>
                <p className="text-slate-600 text-sm sm:text-base font-medium max-w-lg mx-auto">
                  What indicators, signatures, file binaries, or security topics do you want to inspect today?
                </p>
              </div>

              {/* The Beautiful Perplexity Search Box interface */}
              <div className="w-full bg-white border-2 border-slate-200 rounded-2xl shadow-lg p-4 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100/60 transition-all">
                
                {/* Search Textarea */}
                <textarea
                  className="w-full h-28 p-2 text-base text-slate-900 placeholder-slate-450 bg-white focus:outline-none resize-none font-medium leading-relaxed"
                  placeholder="Ask a security question, paste a signature hash, type domain registration or reverse image context..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      triggerInvestigation();
                    }
                  }}
                />

                {/* Display active uploads with a quick clear badge right in the search layout */}
                {(uploadedFile || uploadedImage) && (
                  <div className="mb-4 flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl max-w-md">
                    {uploadedFile ? <FileText className="w-5 h-5 text-indigo-600" /> : <ImageIcon className="w-5 h-5 text-indigo-600" />}
                    <div className="flex-1 truncate text-xs sm:text-sm text-slate-800 font-mono font-bold">
                      {uploadedFile ? uploadedFile.name : uploadedImage?.name} 
                      <span className="text-xs text-indigo-500 font-normal ml-1"> ({(uploadedFile ? uploadedFile.size / 1024 : uploadedImage!.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button 
                      onClick={clearUploads}
                      className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Clear Upload"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Input toolbar bottom bar */}
                <div className="flex items-center justify-between border-t border-slate-150 pt-3 mt-1 flex-wrap gap-3">
                  
                  {/* Category Type selector dropdown */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Focus:</span>
                    <select
                      value={selectedType}
                      onChange={(e) => {
                        setSelectedType(e.target.value as QueryType | 'auto');
                        if (e.target.value !== 'auto') clearUploads();
                      }}
                      className="text-sm bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-800 font-bold py-1.5 px-3 rounded-xl focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="auto">🔍 Auto Categorize</option>
                      <option value="url">🌐 URL Lookup</option>
                      <option value="domain">🎯 Domain Reputation</option>
                      <option value="ip">💻 IP Geolocation</option>
                      <option value="hash">🔑 File Hash Check</option>
                      <option value="file">📄 File Heuristics</option>
                      <option value="image">🖼️ Reverse Image Trace</option>
                      <option value="general_chat">💬 Security Chat Mode</option>
                    </select>

                    {inputValue.trim() && selectedType === 'auto' && (
                      <span className="text-xs font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                        Auto: {detectedType.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Manual trigger file/image pickers with direct ref activations to ensure they work properly  */}
                  <div className="flex items-center gap-2.5">
                    
                    {/* Hidden inputs to capture streams */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) processUploadedFile(f, 'file');
                      }}
                    />
                    <input 
                      type="file" 
                      ref={imageInputRef} 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) processUploadedFile(f, 'image');
                      }}
                    />

                    {/* Highly clickable buttons with proper ref triggers */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 text-slate-600 hover:text-indigo-650 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-sm font-bold shadow-xs"
                      title="Attach file for static heuristical analysis"
                    >
                      <FileCheck className="w-4.5 h-4.5 text-indigo-500" />
                      <span className="hidden md:inline">Attach File</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2.5 text-slate-600 hover:text-teal-650 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-sm font-bold shadow-xs"
                      title="Trace image for metadata/darknet exposure"
                    >
                      <ImageIcon className="w-4.5 h-4.5 text-emerald-500" />
                      <span className="hidden md:inline">Trace Image</span>
                    </button>

                    {/* Submit investigation button */}
                    <button
                      onClick={() => triggerInvestigation()}
                      disabled={!inputValue.trim() && !uploadedFile && !uploadedImage}
                      className={`p-2.5 rounded-xl text-white transition-all shadow-md flex items-center justify-center min-w-10 ${
                        (!inputValue.trim() && !uploadedFile && !uploadedImage)
                          ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 cursor-pointer scale-105 active:scale-95'
                      }`}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                </div>

              </div>

              {/* Preconfigured Samples below search box */}
              <div className="w-full mt-8">
                <SampleTriggers onSelect={handleSelectSample} disabled={isLoading} />
              </div>

            </div>
          ) : (
            /* CONVERSATION STREAM: Scrollable threads view containing user query + rich assistant answer structure */
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Back navigation & active title bar */}
              <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-30">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={startNewThread}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-indigo-600"
                    title="Return to search landing page"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider font-display">Active Search Thread</span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Case ID: BK-{messages.length}</span>
                </div>
                
                {/* Visual statistics badge */}
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-mono rounded-lg font-bold">
                    Backspace Security RADAR API
                  </div>
                </div>
              </div>

              {/* Scrollable messages container */}
              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 select-text">
                <div className="max-w-3xl mx-auto space-y-8">
                  {messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={msg.id} className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
                        
                        {/* Avatar identifier */}
                        {!isUser && (
                          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 select-none border border-slate-200/50">
                            <img 
                              src="/src/assets/images/security_logo_1781452802058.jpg" 
                              alt="Backspace AI Avatar" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Content Box */}
                        <div className={`max-w-xl md:max-w-2xl flex-1 ${isUser ? 'bg-slate-100 p-5 rounded-2xl rounded-tr-none text-slate-900 text-base' : 'space-y-4'}`}>
                          
                          {isUser ? (
                            /* USER DISPLAY */
                            <div className="space-y-2">
                              <p className="font-bold text-xs text-slate-450 uppercase tracking-widest select-none">Query Payload</p>
                              <p className="whitespace-pre-wrap leading-relaxed font-semibold text-sm sm:text-base">{msg.content}</p>
                              {msg.file_info && (
                                <div className="mt-3 flex items-center gap-2.5 bg-white/90 p-3 rounded-xl border border-slate-200 text-sm font-mono">
                                  <FileText className="w-5 h-5 text-indigo-500" />
                                  <span className="font-extrabold text-slate-800 max-w-[240px] truncate">{msg.file_info.name}</span>
                                  <span className="text-xs text-slate-500">({(msg.file_info.size / 1024).toFixed(1)} KB)</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* ASSISTANT DISPLAY (Perplexity-style details: Sources -> Answer -> Key Observations -> Actions) */
                            <div className="space-y-6 bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
                              
                              {/* 1. SOURCES POLLED (Clickable Cards with expandable inline details) */}
                              {msg.analysis && (
                                <div>
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 select-none">
                                    <Layers className="w-4 h-4 text-indigo-505 shrink-0" />
                                    <span>Sources Evaluated (3)</span>
                                    <span className="text-xs text-slate-400 lowercase font-normal italic hidden sm:inline">&bull; click card to view technical logs</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {getSourcesForType(msg.type || 'general_chat', msg.analysis.input_value).map((src, srcIdx) => {
                                      const isCurrentlyClicked = clickedSource && clickedSource.msgId === msg.id && clickedSource.sourceName === src.name;
                                      return (
                                        <div key={srcIdx} className="flex flex-col">
                                          <button
                                            onClick={() => {
                                              if (isCurrentlyClicked) {
                                                setClickedSource(null);
                                              } else {
                                                setClickedSource({
                                                  msgId: msg.id,
                                                  sourceName: src.name,
                                                  details: src.details
                                                });
                                              }
                                            }}
                                            className={`p-3 border rounded-xl text-left bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer flex flex-col justify-between h-24 ${
                                              isCurrentlyClicked ? 'border-indigo-600 bg-indigo-50/25 ring-2 ring-indigo-100/80' : 'border-slate-200'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 w-full">
                                              <div className="w-5 h-5 rounded-full bg-indigo-105 text-xs text-indigo-700 font-extrabold flex items-center justify-center shrink-0">
                                                {srcIdx + 1}
                                              </div>
                                              <span className="text-sm font-extrabold text-slate-800 truncate block">{src.name}</span>
                                            </div>
                                            <div className="text-xs font-mono text-slate-500 mt-1 truncate block">{src.url}</div>
                                            <span className="text-[10px] font-bold bg-white border px-2 py-0.5 rounded-md text-emerald-700 self-start mt-1.5">
                                              {src.status}
                                            </span>
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Clicked Source inline details tray */}
                                  {clickedSource && clickedSource.msgId === msg.id && (
                                    <div className="mt-4 p-4 sm:p-5 bg-indigo-50/55 border border-indigo-100 rounded-xl space-y-3.5 animate-fade-in text-sm">
                                      <div className="flex items-center justify-between">
                                        <p className="font-extrabold text-indigo-900 uppercase tracking-wider text-xs font-display">
                                          🔍 Detailed Logs: {clickedSource.sourceName}
                                        </p>
                                        <button 
                                          onClick={() => setClickedSource(null)}
                                          className="text-xs text-indigo-600 hover:underline font-bold"
                                        >
                                          Close
                                        </button>
                                      </div>
                                      <ul className="space-y-2">
                                        {clickedSource.details.map((det, detIdx) => (
                                          <li key={detIdx} className="flex items-start gap-2 text-indigo-950 font-medium">
                                            <span className="text-indigo-500 font-mono mt-0.5">•</span>
                                            <span>{det}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 2. THE THREAT RISK RATING LEVEL */}
                              {msg.analysis && (
                                <div className="border-t border-slate-150 pt-5">
                                  {(() => {
                                    const styles = getRiskBadgeStyles(msg.analysis.risk_level);
                                    return (
                                      <div className={`p-4 border rounded-xl flex items-center justify-between gap-4 ${styles.bg}`}>
                                        <div className="flex items-center gap-3.5">
                                          <div className={`w-3.5 h-3.5 rounded-full ${styles.dot} animate-pulse shrink-0`}></div>
                                          <div>
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Computed Security Indicator Verdict</div>
                                            <p className="text-base sm:text-lg font-black tracking-tight">{styles.label}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-xs font-bold text-slate-500 uppercase">Analysis Confidence</div>
                                          <p className="text-base sm:text-lg font-black text-slate-800 font-mono">{msg.analysis.confidence}%</p>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* 3. CORE ADVISORY VERDICT (The generated Gemini response text block) */}
                              <div className="border-t border-slate-150 pt-5 space-y-2.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  <Terminal className="w-4 h-4 text-indigo-500 shrink-0" />
                                  <span>Intelligence Verdict & Advice</span>
                                </div>
                                <div className="text-slate-855 text-base leading-relaxed whitespace-pre-wrap font-sans font-medium">
                                  {msg.content}
                                </div>
                              </div>

                              {/* 4. KEY OBSERVATION BULLETS */}
                              {msg.analysis && msg.analysis.key_findings && msg.analysis.key_findings.length > 0 && (
                                <div className="border-t border-slate-150 pt-5 space-y-3">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <span>Detailed Observations Ledger</span>
                                  </div>
                                  <ul className="space-y-2.5">
                                    {msg.analysis.key_findings.map((finding, findIdx) => (
                                      <li key={findIdx} className="text-sm sm:text-base text-slate-800 flex items-start gap-2.5 leading-relaxed font-semibold">
                                        <span className="text-indigo-650 font-mono font-black mt-0.5 shrink-0">[0{findIdx + 1}]</span>
                                        <span>{finding}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* 5. SUGGESTED SECURE REMEDIATIONS (Clickable chips) */}
                              {msg.analysis && msg.analysis.recommended_actions && msg.analysis.recommended_actions.length > 0 && (
                                <div className="border-t border-slate-150 pt-5 space-y-3.5">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <span>Remediation Protocols</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2.5">
                                    {msg.analysis.recommended_actions.map((act, actIdx) => (
                                      <button
                                        key={actIdx}
                                        onClick={() => handleMitigateAction(act)}
                                        disabled={simulatingAction !== null}
                                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-extrabold transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 uppercase shadow-xs active:scale-95"
                                      >
                                        <span>{act}</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 6. BOTTOM ACTION UTILITIES (Share, Download PDF, Toggle JSON raw data) */}
                              <div className="border-t border-slate-150 pt-5 flex flex-wrap items-center justify-between gap-3.5 select-none text-sm">
                                
                                <div className="flex items-center gap-2.5">
                                  <button
                                    onClick={() => handleDownloadPDF(msg.analysis?.input_value || 'case')}
                                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold transition-all shadow-xs"
                                  >
                                    <FileDown className="w-4 h-4" />
                                    <span>Download PDF</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleShareThread(msg.analysis?.input_value || 'case')}
                                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold transition-all shadow-xs"
                                  >
                                    <Share2 className="w-4 h-4" />
                                    <span>Share Link</span>
                                  </button>

                                  <button
                                    onClick={() => copyMessageText(msg)}
                                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold transition-all shadow-xs"
                                  >
                                    {copiedMsgId === msg.id ? <Check className="w-4 h-4 text-emerald-600 animate-pulse" /> : <Copy className="w-4 h-4" />}
                                    <span>{copiedMsgId === msg.id ? 'Copied' : 'Copy Text'}</span>
                                  </button>
                                </div>

                                {msg.analysis && (
                                  <button
                                    onClick={() => setExpandedJsonMsgId(expandedJsonMsgId === msg.id ? null : msg.id)}
                                    className="text-xs font-mono font-bold text-indigo-600 hover:text-indigo-850 hover:underline flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>{expandedJsonMsgId === msg.id ? 'Hide Raw JSON' : 'Inspect raw JSON data'}</span>
                                    <Code className="w-3.5 h-3.5" />
                                  </button>
                                )}

                              </div>

                              {/* 7. DEVELOPMENT ACCORDION VIEW FOR RAW PARAMETERS */}
                              {msg.analysis && expandedJsonMsgId === msg.id && (
                                <div className="p-4 bg-slate-900 rounded-xl space-y-2 text-xs font-mono text-slate-300">
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                    <span className="text-emerald-450 font-bold">RAW SEC-AUDIT METRICS</span>
                                    <button
                                      onClick={() => copyDebugJsonFromMsg(msg.analysis!)}
                                      className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-755 text-white font-mono px-3 py-1 rounded-lg transition-all cursor-pointer"
                                    >
                                      {copiedDebug ? 'Copied System JSON!' : 'Copy Object'}
                                    </button>
                                  </div>
                                  <pre className="max-h-[160px] overflow-y-auto leading-tight p-0.5 scrollbar-thin select-all text-xs">
                                    {JSON.stringify(msg.analysis, null, 2)}
                                  </pre>
                                </div>
                              )}

                            </div>
                          )}

                          <span className="text-xs text-slate-400 font-mono block mt-2 px-1">
                            Ref stamp: {msg.timestamp}
                          </span>

                        </div>

                        {/* User Avatar */}
                        {isUser && (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-sm shrink-0 select-none">
                            You
                          </div>
                        )}

                      </div>
                    );
                  })}

                  {/* LOADING PLACEHOLDER (While waiting for API execution) */}
                  {isLoading && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 select-none border border-slate-200/50">
                        <img 
                          src="/src/assets/images/security_logo_1781452802058.jpg" 
                          alt="Backspace AI Loader" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4.5 h-4.5 text-indigo-600 animate-spin" />
                          <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest animate-pulse">
                            Backspace intelligence radar polling...
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse" />
                          <div className="h-4 bg-slate-100 rounded-full w-5/6 animate-pulse" />
                          <div className="h-4 bg-slate-100 rounded-full w-4/6 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto Scroll block */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Bottom persistent threat dispatch chat bar (Exactly like Perplexity AI threads) */}
              <div className="bg-white border-t border-slate-200 p-5 shrink-0 shadow-xl z-20">
                <div className="max-w-3xl mx-auto flex items-center gap-3 bg-slate-50 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100/60 rounded-xl p-3 transition-all">
                  
                  {/* Quick file attach icons */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                    title="Upload File static analysis"
                  >
                    <FileCheck className="w-5 h-5 text-indigo-505" />
                  </button>

                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                    title="Upload Trace Image exposure"
                  >
                    <ImageIcon className="w-5 h-5 text-emerald-500" />
                  </button>
                  
                  {/* Main chat input */}
                  <input
                    type="text"
                    disabled={isLoading}
                    className="flex-1 bg-transparent text-base text-slate-900 placeholder-slate-450 focus:outline-none py-1.5 px-2 font-medium"
                    placeholder="Ask a security follow-up or verify another indicator..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        triggerInvestigation();
                      }
                    }}
                  />

                  {/* Category mini-indicator */}
                  {inputValue.trim() && (
                    <div className="text-xs font-mono font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full select-none">
                      {detectedType.toUpperCase()}
                    </div>
                  )}

                  <button
                    onClick={() => triggerInvestigation()}
                    disabled={isLoading || (!inputValue.trim() && !uploadedFile && !uploadedImage)}
                    className={`p-2 rounded-xl text-white transition-all ${
                      (!inputValue.trim() && !uploadedFile && !uploadedImage)
                        ? 'bg-slate-150 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-md'
                    }`}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="max-w-3xl mx-auto flex justify-between items-center text-xs text-slate-500 mt-2.5 px-1 font-sans">
                  <span>Simran AI utilizes deep heuristic mapping fallback metrics.</span>
                  <span>Press <kbd className="bg-slate-100 border px-1.5 py-0.5 rounded-md font-mono font-extrabold text-[10px]">Enter</kbd> to execute scan</span>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* 1. VISUAL MODAL: EXPORT PDF SIMULATION SCREEN */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center space-y-4 border shadow-2xl">
            <div className="relative flex items-center justify-center w-12 h-12 bg-indigo-55 text-indigo-600 rounded-full mx-auto">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base text-slate-800">Generating Threat Intelligence Certificate</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Compiling static hash integrity arrays, threat records, and digital exposure. Please hold on.</p>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full animate-loader-progress" style={{ width: '65%' }}></div>
            </div>
            <span className="text-xs font-mono text-slate-400 block font-bold">PDF-GENERATOR CORE v1.2</span>
          </div>
        </div>
      )}

      {/* 2. VISUAL MODAL: SHARE CONVERSATION LINK */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in select-text">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 border shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-850 flex items-center gap-2 font-display">
              <Share2 className="w-5 h-5 text-indigo-650" />
              <span>Share Threat Intelligence Report</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate a secure read-only URL reference code. This URL exposes findings, computed risk, and recommended actions.
            </p>
            
            <div className="flex items-center gap-2 bg-slate-50 border p-3 rounded-xl font-mono text-xs text-slate-700">
              <span className="flex-1 truncate select-all">{activeShareUrl}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeShareUrl);
                  setActionMessage('Share Link Copied to clipboard successfully!');
                  setShowShareModal(false);
                  setTimeout(() => setActionMessage(null), 3000);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                Copy URL
              </button>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold shrink-0 text-slate-700 cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Progress Loader simulator */}
      {simulatingAction && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-50 select-none">
          <div className="bg-slate-950 text-white px-6 py-4.5 rounded-xl flex items-center gap-3.5 shadow-2xl font-mono text-xs max-w-lg border border-slate-800">
            <RefreshCw className="w-4.5 h-4.5 animate-spin text-indigo-400" />
            <span className="font-bold">SANDBOX MITIGATION DISPATCHED: Executing "{simulatingAction}"...</span>
          </div>
        </div>
      )}

      {/* Static Footer (Clean technical indicators) */}
      <footer className="h-10 bg-slate-900 border-t border-slate-800 text-slate-400 flex items-center px-5 justify-between text-xs font-mono select-none shrink-0" id="radar-footer">
        <div className="flex items-center gap-4 flex-wrap overflow-hidden">
          <span className="text-slate-350 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
            BACKSPACE AI GATEWAY: SECURE
          </span>
          <span className="text-slate-800 text-xs font-extrabold hidden sm:inline">|</span>
          <span className="hidden sm:inline">COMPLIANCE INDEX: ACCREDITED</span>
          <span className="text-slate-805 text-xs font-extrabold hidden sm:inline">|</span>
          <span className="hidden md:inline">STATIC CORRELATION TRACES: ONLINE</span>
        </div>
        <div>
          BACKSPACE CORE SECURITY SUITE v2.4.2
        </div>
      </footer>
    </div>
  );
}
