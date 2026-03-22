import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ============================================================
   SPEECH RECOGNITION TYPES
============================================================ */
interface WindowWithSpeech extends Window {
  SpeechRecognition: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition: new () => SpeechRecognitionInstance;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

/* ============================================================
   APP TYPES
============================================================ */
interface Message {
  sender: 'user' | 'bot';
  text: string;
  time?: string;
}
interface RiskData {
  cyclone: number;
  rain: number;
  storm: number;
  high_wave: number;
  safe_score: number;
}
interface WeatherData {
  location?: string;
  temp?: number | string;
  wind?: number | string;
  wave?: number | string;
  wave_forecast?: number | string;
  dissolved_oxygen?: number | string;
  ph?: number | string;
  salinity?: number | string;
  rainfall?: number;
  humidity?: number | string;
  pressure?: number | string;
  is_forecast?: boolean;
  risks?: RiskData;
  open_planner?: boolean;
}
interface ApiResponse {
  reply?: string;
  response?: string;
  data?: WeatherData;
}
interface RequestBody {
  message: string;
  history: { sender: string; text: string }[];
  planned_datetime?: string;
  planned_activity?: string;
  planned_location?: string;
}

/* ============================================================
   CONSTANTS
============================================================ */
const BASE_URL = 'http://127.0.0.1:8000/api';

const ODISHA_LOCATIONS_LIST = [
  'Puri', 'Konark', 'Paradip', 'Gopalpur', 'Chandipur',
  'Balasore', 'Bhadrak', 'Kendrapara', 'Jagatsinghpur',
  'Ganjam', 'Berhampur', 'Chilika Lake', 'Rushikulya',
  'Dhamra', 'Pentha', 'Astaranga', 'Satpada', 'Tampara',
  'Bahuda', 'Palur', 'Nuagarh', 'Sonapur', 'Markandi',
];

const quickActions = [
  { emoji: '🎣', label: 'Fishing Safety',      sub: 'Is it safe to fish today?',        msg: 'is it safe to go fishing today?' },
  { emoji: '🏊', label: 'Swimming Conditions', sub: 'Check if swimming is safe',         msg: 'is it safe to swim today?' },
  { emoji: '⛵', label: 'Boat Safety',          sub: 'Sailing conditions right now',      msg: 'boat and sailing conditions today' },
  { emoji: '🌊', label: 'Wave Forecast',        sub: 'Current and predicted wave height', msg: 'what are the wave conditions today' },
  { emoji: '🌀', label: 'Cyclone Risk',         sub: 'Storm and cyclone probability',     msg: 'what is the cyclone risk today' },
  { emoji: '🔬', label: 'Water Quality',        sub: 'Oxygen, pH and salinity levels',   msg: 'what is the water quality today' },
];

const suggestions = ['🎣 Fishing', '🌡️ Temp', '💨 Wind', '🌊 Wave', '🏊 Swimming', '⛵ Boat'];

/* ============================================================
   COMPONENT
============================================================ */
const Chatbot: React.FC = () => {
  const [isOpen,           setIsOpen]           = useState(false);
  const [messages,         setMessages]         = useState<Message[]>([{
    sender: 'bot',
    text: '🌊 Hello! I am Neer Ocevia, your ocean safety assistant for Odisha.\n\nAsk me about conditions or use the 📅 Plan Trip button to check a specific date, time and location!',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }]);
  const [input,            setInput]            = useState('');
  const [isTyping,         setIsTyping]         = useState(false);
  const [showDot,          setShowDot]          = useState(false);
  const [weatherData,      setWeatherData]      = useState<WeatherData | null>(null);
  const [showWeatherCard,  setShowWeatherCard]  = useState(false);
  const [riskData,         setRiskData]         = useState<RiskData | null>(null);
  const [weatherLoading,   setWeatherLoading]   = useState(false);
  const [stormAlert,       setStormAlert]       = useState(false);
  const [stormMessage,     setStormMessage]     = useState('');
  const [isListening,      setIsListening]      = useState(false);
  const [showPlanner,      setShowPlanner]      = useState(false);
  const [planDate,         setPlanDate]         = useState('');
  const [planTime,         setPlanTime]         = useState('06:00');
  const [planActivity,     setPlanActivity]     = useState('fishing');
  const [planLocation,     setPlanLocation]     = useState('Puri');
  const [activeLocation,   setActiveLocation]   = useState('puri');

  // ✅ NEW — thinking popup states
  const [showThinkBubble,  setShowThinkBubble]  = useState(true);
  const [hidingBubble,     setHidingBubble]     = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesRef  = useRef<Message[]>(messages);
  const isOpenRef    = useRef<boolean>(isOpen);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isOpenRef.current  = isOpen;    }, [isOpen]);
  useEffect(() => { if (isOpen) setShowDot(false);  }, [isOpen]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { setPlanDate(new Date().toISOString().split('T')[0]); }, []);

  // ✅ NEW — show popup when closed, auto-hide after 5s, re-appear when chat closes
  useEffect(() => {
    if (!isOpen) {
      setShowThinkBubble(true);
      setHidingBubble(false);
      const t = setTimeout(() => {
        setHidingBubble(true);
        setTimeout(() => setShowThinkBubble(false), 350);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const dismissBubble = () => {
    setHidingBubble(true);
    setTimeout(() => setShowThinkBubble(false), 350);
  };

  /* ============================================================
     FETCH LIVE WEATHER
  ============================================================ */
  const fetchWeather = useCallback(async (locationKey: string) => {
    setWeatherLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/weather/?location=${locationKey.toLowerCase()}`);
      const data: WeatherData = await res.json();
      setWeatherData(data);
      if (data.risks) {
        const r = data.risks;
        if (
          typeof r.cyclone    === 'number' &&
          typeof r.rain       === 'number' &&
          typeof r.storm      === 'number' &&
          typeof r.high_wave  === 'number' &&
          typeof r.safe_score === 'number'
        ) setRiskData(r);
      }
      if (Number(data.wave) > 2.5) {
        setStormAlert(true);
        setStormMessage(`⚠️ High waves in ${data.location ?? locationKey}! Wave: ${data.wave}m. Avoid the sea!`);
      }
    } catch (e) {
      console.error('Weather fetch error:', e);
    }
    setWeatherLoading(false);
  }, []);

  useEffect(() => { if (isOpen) fetchWeather(activeLocation); }, [isOpen]);       // eslint-disable-line
  useEffect(() => { if (isOpen) fetchWeather(activeLocation); }, [activeLocation]); // eslint-disable-line

  /* ============================================================
     SEND MESSAGE
  ============================================================ */
  const sendMessage = useCallback(async (
    voiceText?: string,
    plannedDatetime?: string,
    plannedActivity?: string,
    plannedLocation?: string,
  ) => {
    const currentInput = voiceText ?? input;
    if (!currentInput.trim() && !plannedDatetime) return;

    const userText = plannedDatetime
      ? `📅 Check ${plannedActivity} at ${plannedLocation} on ${new Date(plannedDatetime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
      : currentInput.trim();

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text: userText, time: currentTime }]);
    setInput('');
    setShowPlanner(false);
    setIsTyping(true);

    try {
      const body: RequestBody = {
        message: plannedDatetime ? `check ${plannedActivity} conditions` : currentInput.trim(),
        history: messagesRef.current.map(m => ({ sender: m.sender, text: m.text })),
      };
      if (plannedDatetime) body.planned_datetime = plannedDatetime;
      if (plannedActivity) body.planned_activity = plannedActivity;
      if (plannedLocation) body.planned_location = plannedLocation;

      const response = await fetch(`${BASE_URL}/chat/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data: ApiResponse = await response.json();
      setIsTyping(false);

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let replyText = '🌊 Response received.';
      if      (typeof data.reply    === 'string') replyText = data.reply;
      else if (typeof data.response === 'string') replyText = data.response;

      replyText = replyText
        .replace(/\*\*/g, '').replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '').replace(/`/g, '')
        .replace('__OPEN_PLANNER__', '')
        .trim();

      setMessages(prev => [...prev, { sender: 'bot', text: replyText, time: botTime }]);

      if (data.data && typeof data.data === 'object') {
        const d = data.data;
        if (d.open_planner) setTimeout(() => setShowPlanner(true), 800);
        if (d.location && d.temp !== '--' && d.temp !== undefined) {
          setWeatherData(d);
          if (d.risks) {
            const r = d.risks;
            if (
              typeof r.cyclone    === 'number' &&
              typeof r.rain       === 'number' &&
              typeof r.storm      === 'number' &&
              typeof r.high_wave  === 'number' &&
              typeof r.safe_score === 'number'
            ) setRiskData(r);
          }
          const newLocKey = d.location.toLowerCase().replace(' ', '');
          setActiveLocation(newLocKey);
          if (Number(d.wave) > 2.5) {
            setStormAlert(true);
            setStormMessage(`⚠️ High waves in ${d.location}! Wave: ${d.wave}m. Avoid the sea!`);
          }
        }
      }
      if (!isOpenRef.current) setShowDot(true);

    } catch {
      setIsTyping(false);
      const errTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, {
        sender: 'bot',
        text:   '❌ Cannot reach backend. Make sure Django is running on port 8000.',
        time:   errTime,
      }]);
      if (!isOpenRef.current) setShowDot(true);
    }
  }, [input]);

  const handlePlannerSubmit = () => {
    if (!planDate || !planTime) return;
    sendMessage(undefined, `${planDate}T${planTime}:00`, planActivity, planLocation);
  };

  /* ============================================================
     VOICE INPUT
  ============================================================ */
  const startVoice = useCallback(() => {
    const win = window as unknown as WindowWithSpeech;
    const SR  = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported. Use Chrome.'); return; }
    const recognition = new SR();
    recognition.lang           = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous     = true;
    setIsListening(true);
    let final = '';
    let timer: ReturnType<typeof setTimeout> | null = null;
    recognition.onresult = (e: SpeechRecognitionResultEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final   += t;
        else                       interim += t;
      }
      setInput(final + interim);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => recognition.stop(), 2000);
    };
    recognition.onend   = () => {
      setIsListening(false);
      if (timer) clearTimeout(timer);
      if (final.trim()) sendMessage(final.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  }, [sendMessage]);

  /* ============================================================
     HELPERS
  ============================================================ */
  const getRiskColor = (v: number) => {
    if (v < 20) return { text: '#86efac', bar: 'linear-gradient(90deg,#4ade80,#22c55e)' };
    if (v < 50) return { text: '#fcd34d', bar: 'linear-gradient(90deg,#fcd34d,#f59e0b)' };
    return       { text: '#fca5a5', bar: 'linear-gradient(90deg,#fca5a5,#ef4444)' };
  };

  const safeScoreColor = (score?: number) => {
    if (!score) return '#64748b';
    if (score > 70) return '#86efac';
    if (score > 40) return '#fcd34d';
    return '#fca5a5';
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family:'Inter',sans-serif; box-sizing:border-box; }

        /* ── existing animations ── */
        @keyframes pulseGlow {
          0%  { box-shadow:0 0 0 0 rgba(56,189,248,.7),0 8px 32px rgba(14,165,233,.4); }
          70% { box-shadow:0 0 0 16px rgba(56,189,248,0),0 8px 32px rgba(14,165,233,.4); }
          100%{ box-shadow:0 0 0 0 rgba(56,189,248,0),0 8px 32px rgba(14,165,233,.4); }
        }
        @keyframes micPulse {
          0%  { box-shadow:0 0 0 0 rgba(239,68,68,.5); }
          70% { box-shadow:0 0 0 10px rgba(239,68,68,0); }
          100%{ box-shadow:0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes msgIn { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0) scale(1)} 40%{transform:translateY(-6px) scale(1.2)} }
        @keyframes waveSway { 0%{transform:translateX(0)} 50%{transform:translateX(-25%)} 100%{transform:translateX(0)} }
        @keyframes pulseGreen { 0%{box-shadow:0 0 0 0 rgba(74,222,128,.7)} 70%{box-shadow:0 0 0 6px rgba(74,222,128,0)} 100%{box-shadow:0 0 0 0 rgba(74,222,128,0)} }
        @keyframes floatBubble { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes expandCard { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes plannerIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes quickIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

        /* ── ✅ NEW — thinking popup animations ── */
        @keyframes popIn {
          0%   { opacity:0; transform:scale(.6) translateY(12px); }
          70%  { transform:scale(1.05) translateY(-2px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes popOut {
          0%   { opacity:1; transform:scale(1) translateY(0); }
          100% { opacity:0; transform:scale(.7) translateY(10px); }
        }
        @keyframes thinkDot {
          0%,80%,100% { transform:translateY(0); opacity:.35; }
          40%          { transform:translateY(-5px); opacity:1; }
        }

        /* ── ✅ NEW — thinking bubble styles ── */
        .think-bubble {
          position:absolute;
          bottom:82px;
          right:0;
          background:white;
          color:#0c1e3d;
          font-size:13px;
          font-weight:600;
          line-height:1.4;
          padding:11px 15px 11px 12px;
          border-radius:18px 18px 4px 18px;
          white-space:nowrap;
          box-shadow:0 8px 32px rgba(0,0,0,.18), 0 2px 8px rgba(14,165,233,.15);
          animation:popIn .45s cubic-bezier(.175,.885,.32,1.275) forwards;
          display:flex;
          align-items:center;
          gap:9px;
          cursor:pointer;
          user-select:none;
          border:1.5px solid rgba(14,165,233,.15);
        }
        .think-bubble.hiding {
          animation:popOut .35s ease forwards;
        }
        .think-bubble::after {
          content:'';
          position:absolute;
          bottom:-9px;
          right:22px;
          width:0; height:0;
          border-left:9px solid transparent;
          border-right:0 solid transparent;
          border-top:9px solid white;
          filter:drop-shadow(0 2px 2px rgba(0,0,0,.08));
        }
        .think-dots {
          display:flex;
          gap:3px;
          flex-shrink:0;
        }
        .think-dots span {
          width:5px; height:5px; border-radius:50%;
          background:#0ea5e9;
          display:block;
          animation:thinkDot 1.1s infinite ease-in-out;
        }
        .think-dots span:nth-child(2) { animation-delay:.18s; }
        .think-dots span:nth-child(3) { animation-delay:.36s; }

        /* ── existing styles ── */
        .sidebar-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(4px);z-index:9990;animation:fadeIn .3s ease forwards; }
        .custom-scrollbar::-webkit-scrollbar{width:5px}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25);border-radius:4px}
        .hide-scrollbar::-webkit-scrollbar{display:none}
        .chat-input-glass{background:rgba(255,255,255,.12)!important;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.25)!important;color:white!important;font-size:15px;}
        .chat-input-glass::placeholder{color:rgba(255,255,255,.5)!important}
        .chat-input-glass:focus{outline:none;border-color:rgba(255,255,255,.5)!important;box-shadow:0 0 0 3px rgba(255,255,255,.1)!important}
        .plan-select,.plan-input{background:rgba(255,255,255,.12)!important;border:1px solid rgba(255,255,255,.25)!important;color:white!important;border-radius:12px;padding:8px 12px;font-size:13px;width:100%;cursor:pointer;}
        .plan-select option{background:#0a3d62;color:white}
        .plan-input::-webkit-calendar-picker-indicator{filter:invert(1)}
        .plan-input:focus,.plan-select:focus{outline:none;border-color:rgba(255,255,255,.5)!important}
        .bubble-btn{animation:floatBubble 3s ease-in-out infinite,pulseGlow 2.5s infinite;transition:transform .3s cubic-bezier(.175,.885,.32,1.275);}
        .bubble-btn:hover{transform:translateY(-6px) scale(1.1)!important}
        .reaction-thumb{opacity:0;transition:opacity .2s,transform .2s;transform:scale(.8)}
        .msg-container:hover .reaction-thumb{opacity:1;transform:scale(1)}
        .weather-mini{transition:background .2s}
        .weather-mini:hover{background:rgba(255,255,255,.12)!important}
        .suggestion-pill{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:24px;color:rgba(255,255,255,.9);font-size:13px;font-weight:500;padding:8px 18px;cursor:pointer;white-space:nowrap;transition:all .2s;}
        .suggestion-pill:hover{background:rgba(255,255,255,.25);transform:translateY(-2px)}
        .quick-btn{padding:12px 16px;border-radius:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:white;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all .2s;text-align:left;width:100%;}
        .quick-btn:hover{background:rgba(255,255,255,.14);transform:translateX(4px);border-color:rgba(255,255,255,.25)}
        .loc-chip{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:20px;color:rgba(255,255,255,.8);font-size:11px;padding:4px 10px;cursor:pointer;white-space:nowrap;transition:all .15s;flex-shrink:0;}
        .loc-chip:hover{background:rgba(14,165,233,.25);border-color:rgba(14,165,233,.5);}
        .loc-chip.active{background:rgba(14,165,233,.35);border-color:rgba(14,165,233,.7);color:#38bdf8;font-weight:600;}
        .shimmer{background:linear-gradient(90deg,rgba(255,255,255,.06) 25%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.06) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
        @media(max-width:768px){.sidebar-panel{width:100vw!important}}
      `}</style>

      {/* Storm Alert */}
      {stormAlert && (
        <div style={{ position:'fixed', top:'20px', left:'50%', transform:'translateX(-50%)', background:'rgba(239,68,68,.15)', backdropFilter:'blur(20px)', border:'1px solid rgba(239,68,68,.4)', borderRadius:'16px', padding:'16px 24px', zIndex:10001, maxWidth:'400px', width:'90%', boxShadow:'0 8px 32px rgba(239,68,68,.2)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
            <span style={{ fontWeight:'600', color:'#fca5a5', fontSize:'15px' }}>🌊 Ocean Alert</span>
            <button onClick={() => setStormAlert(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#fca5a5', fontSize:'20px' }}>×</button>
          </div>
          <p style={{ color:'#fecaca', fontSize:'14px', margin:0, lineHeight:'1.5' }}>{stormMessage}</p>
        </div>
      )}

      {/* ============================================================
          ✅ FLOATING BUBBLE + THINKING POPUP
      ============================================================ */}
      {!isOpen && (
        <div style={{ position:'fixed', bottom:'28px', right:'28px', zIndex:9999 }}>

          {/* ── Thinking popup ── */}
          {showThinkBubble && (
            <div
              className={`think-bubble${hidingBubble ? ' hiding' : ''}`}
              onClick={dismissBubble}
              title="Click to dismiss"
            >
              <div className="think-dots">
                <span /><span /><span />
              </div>
              Hey! How can I help you today? 🌊
            </div>
          )}

          {/* ── Floating bubble button ── */}
          <div
            className="bubble-btn"
            onClick={() => setIsOpen(true)}
            style={{
              position:'relative',
              width:'72px', height:'72px', borderRadius:'50%',
              background:'linear-gradient(135deg,#0284c7,#0ea5e9,#38bdf8)',
              cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center',
            }}
          >
            <span style={{ fontSize:'34px' }}>🌊</span>
            {showDot && (
              <div style={{ position:'absolute', top:'4px', right:'4px', width:'18px', height:'18px', borderRadius:'50%', background:'#ef4444', border:'2px solid white' }} />
            )}
          </div>

        </div>
      )}

      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      {/* Sidebar Panel */}
      {isOpen && (
        <div className="sidebar-panel" style={{ position:'fixed', top:0, right:0, bottom:0, width:'50vw', height:'100vh', background:'linear-gradient(160deg,#0c1e3d 0%,#0a3d62 35%,#0e6b8c 70%,#0f9b8e 100%)', display:'flex', flexDirection:'column', zIndex:9995, boxShadow:'-20px 0 60px rgba(0,0,0,.5)', animation:'slideInRight .4s cubic-bezier(.175,.885,.32,1.275) forwards', borderLeft:'1px solid rgba(255,255,255,.1)', overflow:'hidden' }}>

          <div style={{ position:'absolute', inset:0, opacity:.04, pointerEvents:'none', zIndex:0, backgroundImage:`radial-gradient(circle at 20% 50%,white 1px,transparent 1px),radial-gradient(circle at 80% 20%,white 1px,transparent 1px)`, backgroundSize:'60px 60px,40px 40px' }} />

          {/* Header */}
          <div style={{ background:'rgba(255,255,255,.06)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.1)', padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'50px', height:'50px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,.05))', border:'1.5px solid rgba(255,255,255,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>🐬</div>
              <div>
                <div style={{ color:'white', fontWeight:'700', fontSize:'19px' }}>Neer Ocevia</div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'3px' }}>
                  <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#4ade80', animation:'pulseGreen 2s infinite' }} />
                  <span style={{ color:'rgba(255,255,255,.7)', fontSize:'12px' }}>Ocean AI Online · Odisha Coast</span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              <button onClick={() => setShowPlanner(p => !p)} style={{ padding:'8px 14px', borderRadius:'20px', background: showPlanner ? 'rgba(14,165,233,.5)' : 'rgba(255,255,255,.1)', border: showPlanner ? '1px solid rgba(14,165,233,.8)' : '1px solid rgba(255,255,255,.25)', color:'white', cursor:'pointer', fontSize:'12px', fontWeight:'500', transition:'all .2s' }}>📅 Plan Trip</button>
              <button onClick={() => setIsOpen(false)} style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }} onMouseOver={e => (e.currentTarget.style.background='rgba(255,255,255,.2)')} onMouseOut={e => (e.currentTarget.style.background='rgba(255,255,255,.1)')}>×</button>
            </div>
          </div>

          {/* Wave strip */}
          <div style={{ width:'100%', height:'24px', overflow:'hidden', flexShrink:0, zIndex:1 }}>
            <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ width:'200%', height:'100%', animation:'waveSway 5s linear infinite', opacity:.2 }}>
              <path fill="rgba(255,255,255,.5)" d="M0,50L80,55C160,60,320,70,480,63C640,57,800,33,960,33C1120,33,1280,57,1360,68L1440,80L1440,0L0,0Z" />
            </svg>
          </div>

          {/* Live Stats Bar */}
          <div style={{ margin:'0 20px 4px', zIndex:1, flexShrink:0 }}>
            <div className="hide-scrollbar" style={{ display:'flex', gap:'6px', overflowX:'auto', marginBottom:'6px', paddingBottom:'2px' }}>
              {['Puri','Paradip','Chilika Lake','Chandipur','Balasore','Gopalpur','Konark'].map(loc => (
                <button key={loc} className={`loc-chip ${activeLocation === loc.toLowerCase().replace(' ','') ? 'active' : ''}`} onClick={() => setActiveLocation(loc.toLowerCase().replace(' ',''))}>{loc}</button>
              ))}
            </div>
            <div className="weather-mini" onClick={() => setShowWeatherCard(p => !p)} style={{ padding:'8px 16px', borderRadius:'12px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', minHeight:'36px' }}>
              {weatherLoading ? (
                <div className="shimmer" style={{ height:'14px', borderRadius:'6px', width:'70%' }} />
              ) : weatherData ? (
                <span style={{ color:'rgba(255,255,255,.75)', fontSize:'12px', display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                  📍 {String(weatherData.location ?? 'Odisha')} · 🌡️ {String(weatherData.temp ?? '--')}°C · 💨 {String(weatherData.wind ?? '--')} km/h · 🌊 {String(weatherData.wave ?? '--')}m
                  {riskData && <span style={{ marginLeft:'4px', color: safeScoreColor(riskData.safe_score), fontWeight:'600' }}>· Safety: {riskData.safe_score}%</span>}
                </span>
              ) : (
                <span style={{ color:'rgba(255,255,255,.4)', fontSize:'12px' }}>Fetching live data...</span>
              )}
              <span style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', marginLeft:'8px', flexShrink:0 }}>{showWeatherCard ? '▲' : '▼ details'}</span>
            </div>

            {showWeatherCard && weatherData && !weatherLoading && (
              <div style={{ marginTop:'6px', padding:'16px 18px', borderRadius:'14px', background:'rgba(255,255,255,.08)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,.12)', animation:'expandCard .25s ease forwards' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'white', fontWeight:'600', fontSize:'14px', marginBottom:'8px' }}>
                      📍 {String(weatherData.location ?? 'Odisha Coast')}
                      {weatherData.is_forecast && <span style={{ fontSize:'11px', color:'#38bdf8', marginLeft:'8px' }}>FORECAST</span>}
                    </div>
                    <div style={{ color:'rgba(255,255,255,.65)', fontSize:'13px', display:'flex', gap:'12px', flexWrap:'wrap' }}>
                      <span>🌡️ {String(weatherData.temp ?? '--')}°C</span>
                      {weatherData.wind             && <span>💨 {weatherData.wind} km/h</span>}
                      {weatherData.wave             && <span>🌊 {weatherData.wave}m</span>}
                      {weatherData.humidity         && <span>💧 {weatherData.humidity}% humidity</span>}
                      {weatherData.pressure         && <span>🔵 {weatherData.pressure} hPa</span>}
                      {weatherData.dissolved_oxygen && <span>🧪 {weatherData.dissolved_oxygen} mg/L O₂</span>}
                      {weatherData.ph               && <span>⚗️ pH {weatherData.ph}</span>}
                    </div>
                    {weatherData.wave_forecast && (
                      <div style={{ marginTop:'8px', padding:'6px 10px', borderRadius:'8px', background:'rgba(255,255,255,.06)', fontSize:'12px', color:'rgba(255,255,255,.8)' }}>
                        🌊 Wave forecast: {weatherData.wave}m → <strong style={{ color:'white' }}>{weatherData.wave_forecast}m</strong> in 3 hrs
                      </div>
                    )}
                    {(weatherData.rainfall ?? 0) > 0.5 && (
                      <div style={{ marginTop:'6px', padding:'5px 10px', borderRadius:'8px', background:'rgba(99,179,237,.15)', fontSize:'12px', color:'rgba(99,179,237,.9)' }}>
                        🌧️ Rainfall: {weatherData.rainfall}mm expected
                      </div>
                    )}
                  </div>
                  <div style={{ padding:'6px 14px', borderRadius:'20px', marginLeft:'12px', background:(Number(weatherData.wave) > 2 || Number(weatherData.wind) > 20) ? 'rgba(239,68,68,.2)' : 'rgba(74,222,128,.2)', border:(Number(weatherData.wave) > 2 || Number(weatherData.wind) > 20) ? '1px solid rgba(239,68,68,.4)' : '1px solid rgba(74,222,128,.4)', color:(Number(weatherData.wave) > 2 || Number(weatherData.wind) > 20) ? '#fca5a5' : '#86efac', fontWeight:'700', fontSize:'13px', flexShrink:0 }}>
                    {(Number(weatherData.wave) > 2 || Number(weatherData.wind) > 20) ? '⚠️ Risky' : '✅ Safe'}
                  </div>
                </div>
                <div style={{ height:'1px', background:'rgba(255,255,255,.1)', margin:'12px 0' }} />
                {riskData && typeof riskData.cyclone === 'number' && (
                  <>
                    <div style={{ color:'rgba(255,255,255,.5)', fontSize:'10px', fontWeight:'600', letterSpacing:'0.8px', marginBottom:'10px' }}>RISK ASSESSMENT</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {([
                        { label:'🌀 Cyclone', value: riskData.cyclone },
                        { label:'🌧️ Rain',    value: riskData.rain },
                        { label:'⛈️ Storm',   value: riskData.storm },
                        { label:'🌊 Waves',   value: riskData.high_wave },
                      ] as { label: string; value: number }[]).map(({ label, value }) => {
                        const c = getRiskColor(value);
                        return (
                          <div key={label}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                              <span style={{ color:'rgba(255,255,255,.7)', fontSize:'12px' }}>{label}</span>
                              <span style={{ color:c.text, fontSize:'12px', fontWeight:'600' }}>{value}%</span>
                            </div>
                            <div style={{ height:'5px', borderRadius:'3px', background:'rgba(255,255,255,.1)', overflow:'hidden' }}>
                              <div style={{ height:'100%', borderRadius:'3px', width:`${value}%`, background:c.bar, transition:'width .8s cubic-bezier(.4,0,.2,1)' }} />
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ marginTop:'6px', padding:'8px 12px', borderRadius:'10px', background: riskData.safe_score > 70 ? 'rgba(74,222,128,.15)' : riskData.safe_score > 40 ? 'rgba(251,191,36,.15)' : 'rgba(239,68,68,.15)', border: riskData.safe_score > 70 ? '1px solid rgba(74,222,128,.3)' : riskData.safe_score > 40 ? '1px solid rgba(251,191,36,.3)' : '1px solid rgba(239,68,68,.3)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ color:'rgba(255,255,255,.8)', fontSize:'12px', fontWeight:'600' }}>Overall Safety Score</span>
                        <span style={{ fontSize:'18px', fontWeight:'700', color: safeScoreColor(riskData.safe_score) }}>{riskData.safe_score}%</span>
                      </div>
                    </div>
                  </>
                )}
                <button onClick={() => fetchWeather(activeLocation)} style={{ marginTop:'12px', width:'100%', padding:'7px', borderRadius:'8px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', color:'rgba(255,255,255,.6)', fontSize:'12px', cursor:'pointer', transition:'background .15s' }} onMouseOver={e => (e.currentTarget.style.background='rgba(255,255,255,.12)')} onMouseOut={e => (e.currentTarget.style.background='rgba(255,255,255,.06)')}>🔄 Refresh live data</button>
              </div>
            )}
          </div>

          {/* Trip Planner */}
          {showPlanner && (
            <div style={{ margin:'0 20px 4px', padding:'16px', borderRadius:'16px', background:'rgba(255,255,255,.08)', backdropFilter:'blur(16px)', border:'1px solid rgba(14,165,233,.4)', zIndex:1, flexShrink:0, animation:'plannerIn .3s ease forwards', boxShadow:'0 4px 20px rgba(14,165,233,.15)' }}>
              <div style={{ color:'white', fontWeight:'600', fontSize:'14px', marginBottom:'12px' }}>📅 Plan Your Sea Trip</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                <div>
                  <div style={{ color:'rgba(255,255,255,.6)', fontSize:'11px', marginBottom:'4px' }}>📍 Location</div>
                  <select className="plan-select" value={planLocation} onChange={e => setPlanLocation(e.target.value)}>
                    {ODISHA_LOCATIONS_LIST.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ color:'rgba(255,255,255,.6)', fontSize:'11px', marginBottom:'4px' }}>🎯 Activity</div>
                  <select className="plan-select" value={planActivity} onChange={e => setPlanActivity(e.target.value)}>
                    <option value="fishing">🎣 Fishing</option>
                    <option value="swimming">🏊 Swimming</option>
                    <option value="boating">⛵ Boating/Sailing</option>
                    <option value="general">🌊 General Conditions</option>
                  </select>
                </div>
                <div>
                  <div style={{ color:'rgba(255,255,255,.6)', fontSize:'11px', marginBottom:'4px' }}>📆 Date</div>
                  <input type="date" className="plan-input" value={planDate} min={new Date().toISOString().split('T')[0]} onChange={e => setPlanDate(e.target.value)} />
                </div>
                <div>
                  <div style={{ color:'rgba(255,255,255,.6)', fontSize:'11px', marginBottom:'4px' }}>⏰ Time</div>
                  <input type="time" className="plan-input" value={planTime} onChange={e => setPlanTime(e.target.value)} />
                </div>
              </div>
              <button onClick={handlePlannerSubmit} style={{ width:'100%', padding:'10px', borderRadius:'12px', background:'linear-gradient(135deg,#0284c7,#0ea5e9)', border:'none', color:'white', fontWeight:'600', fontSize:'14px', cursor:'pointer', boxShadow:'0 4px 16px rgba(14,165,233,.3)', transition:'transform .2s' }} onMouseOver={e => (e.currentTarget.style.transform='scale(1.02)')} onMouseOut={e => (e.currentTarget.style.transform='scale(1)')}>🔍 Check Conditions</button>
            </div>
          )}

          {/* Messages */}
          <div ref={containerRef} className="custom-scrollbar" style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:'16px', zIndex:1 }}>
            {messages.map((m, i) => (
              <div key={i} className="msg-container" style={{ display:'flex', justifyContent: m.sender==='user' ? 'flex-end' : 'flex-start', alignItems:'flex-end', gap:'10px', animation:'msgIn .35s cubic-bezier(.175,.885,.32,1.275) forwards' }}>
                {m.sender==='bot' && <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', flexShrink:0 }}>🌊</div>}
                <div style={{ display:'flex', flexDirection:'column', alignItems: m.sender==='user' ? 'flex-end' : 'flex-start', maxWidth:'75%' }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ padding:'14px 20px', fontSize:'15px', lineHeight:'1.7', wordWrap:'break-word', whiteSpace:'pre-wrap', ...(m.sender==='bot' ? { color:'rgba(255,255,255,.95)', background:'rgba(255,255,255,.08)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,.15)', borderRadius:'20px 20px 20px 4px', boxShadow:'0 4px 20px rgba(0,0,0,.15)' } : { color:'white', background:'linear-gradient(135deg,#0284c7,#0ea5e9)', borderRadius:'20px 20px 4px 20px', boxShadow:'0 4px 20px rgba(14,165,233,.35)', fontWeight:'500' }) }}>{m.text}</div>
                    {m.sender==='bot' && <div className="reaction-thumb" style={{ position:'absolute', right:'-16px', top:'-10px', background:'rgba(255,255,255,.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.2)', borderRadius:'50%', padding:'5px', fontSize:'13px', cursor:'pointer' }}>👍</div>}
                  </div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,.35)', marginTop:'5px', marginLeft: m.sender==='bot' ? '4px' : '0', marginRight: m.sender==='user' ? '4px' : '0' }}>{m.time ?? ''}</div>
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', animation:'quickIn .5s ease forwards' }}>
                <div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', fontWeight:'600', letterSpacing:'0.8px', marginBottom:'4px', marginTop:'4px' }}>QUICK ACTIONS</div>
                {quickActions.map(({ emoji, label, sub, msg: qm }) => (
                  <button key={label} className="quick-btn" onClick={() => sendMessage(qm)}>
                    <span style={{ fontSize:'22px', flexShrink:0 }}>{emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'14px', fontWeight:'600', color:'white' }}>{label}</div>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,.45)', marginTop:'2px' }}>{sub}</div>
                    </div>
                    <span style={{ color:'rgba(255,255,255,.3)', fontSize:'18px', flexShrink:0 }}>›</span>
                  </button>
                ))}
                <button onClick={() => setShowPlanner(true)} style={{ padding:'12px 16px', borderRadius:'14px', background:'linear-gradient(135deg,rgba(14,165,233,.2),rgba(56,189,248,.1))', border:'1px solid rgba(14,165,233,.35)', color:'white', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px', transition:'all .2s', textAlign:'left', width:'100%', marginTop:'4px' }} onMouseOver={e => (e.currentTarget.style.background='linear-gradient(135deg,rgba(14,165,233,.35),rgba(56,189,248,.2))')} onMouseOut={e => (e.currentTarget.style.background='linear-gradient(135deg,rgba(14,165,233,.2),rgba(56,189,248,.1))')}>
                  <span style={{ fontSize:'22px', flexShrink:0 }}>📅</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'14px', fontWeight:'600', color:'white' }}>Plan a Sea Trip</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.5)', marginTop:'2px' }}>Pick date, time, location and activity</div>
                  </div>
                  <span style={{ color:'rgba(14,165,233,.8)', fontSize:'18px', flexShrink:0 }}>›</span>
                </button>
              </div>
            )}

            {isTyping && (
              <div style={{ display:'flex', alignItems:'flex-end', gap:'10px', animation:'msgIn .3s forwards' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px' }}>🌊</div>
                <div style={{ padding:'16px 20px', background:'rgba(255,255,255,.08)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,.15)', borderRadius:'20px 20px 20px 4px', display:'flex', gap:'7px', alignItems:'center' }}>
                  {[0, 0.18, 0.36].map((d, i) => (
                    <div key={i} style={{ width:'9px', height:'9px', borderRadius:'50%', background:'rgba(255,255,255,.7)', animation:`bounce 1.4s infinite ease-in-out ${d}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} style={{ height:'4px' }} />
          </div>

          {/* Suggestion pills */}
          <div className="hide-scrollbar" style={{ display:'flex', overflowX:'auto', padding:'10px 20px', gap:'10px', flexShrink:0, zIndex:1, borderTop:'1px solid rgba(255,255,255,.08)' }}>
            {suggestions.map((s, i) => (
              <button key={i} className="suggestion-pill" onClick={() => sendMessage(s.split(' ').slice(1).join(' ').toLowerCase() + ' conditions today')}>{s}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding:'14px 20px 18px', borderTop:'1px solid rgba(255,255,255,.08)', background:'rgba(0,0,0,.15)', backdropFilter:'blur(10px)', display:'flex', flexDirection:'column', flexShrink:0, zIndex:1 }}>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              <input className="chat-input-glass" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMessage()} placeholder={isListening ? '🎤 Listening...' : 'Ask about ocean conditions in Odisha...'} style={{ flex:1, borderRadius:'28px', padding:'14px 22px', fontSize:'15px' }} />
              <button onClick={startVoice} disabled={isListening} style={{ width:'46px', height:'46px', borderRadius:'50%', border: isListening ? '1.5px solid rgba(239,68,68,.6)' : '1px solid rgba(255,255,255,.25)', background: isListening ? 'rgba(239,68,68,.2)' : 'rgba(255,255,255,.1)', color: isListening ? '#fca5a5' : 'white', display:'flex', alignItems:'center', justifyContent:'center', cursor: isListening ? 'not-allowed' : 'pointer', flexShrink:0, fontSize:'19px', animation: isListening ? 'micPulse 1s infinite' : 'none', transition:'all .2s' }}>{isListening ? '🔴' : '🎤'}</button>
              <button onClick={() => sendMessage()} style={{ width:'46px', height:'46px', borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#0284c7,#0ea5e9)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, boxShadow:'0 4px 20px rgba(14,165,233,.4)', transition:'transform .2s' }} onMouseOver={e => (e.currentTarget.style.transform='scale(1.1)')} onMouseOut={e => (e.currentTarget.style.transform='scale(1)')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div style={{ fontSize:'11px', color: isListening ? 'rgba(252,165,165,.8)' : 'rgba(255,255,255,.3)', marginTop:'6px', paddingLeft:'8px' }}>
              {isListening ? '🎤 Listening... sends after 2s silence' : `${input.length} chars · Enter to send · 📅 Plan Trip for date picker`}
            </div>
          </div>

        </div>
      )}
    </>
  );
};

export default Chatbot;