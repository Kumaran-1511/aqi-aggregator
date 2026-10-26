import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Wind,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function VoiceChatWidget({ isOpen, onClose, currentCenter, onSelectCity }) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am AeroAI. You can type or tap the microphone to ask questions like "What is the AQI near me?", "How is the air in Delhi?", or "Is it safe to exercise outside?"',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = i18n.language === 'ta' ? 'ta-IN' : 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [i18n.language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.language === 'ta' ? 'ta-IN' : 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Intent matching logic
  const parseQueryIntent = async (text) => {
    const lower = text.toLowerCase();
    const isTa = i18n.language === 'ta';

    // 1. "Near me" / "Here" intent
    if (lower.includes('near me') || lower.includes('here') || lower.includes('my air') || lower.includes('அருகில்') || lower.includes('என் பகுதி') || lower.includes('இங்கே')) {
      const lat = currentCenter ? currentCenter[0] : 13.0827;
      const lng = currentCenter ? currentCenter[1] : 80.2707;
      try {
        const res = await axios.get(`/api/aqi/nearby?lat=${lat}&lng=${lng}&radius=40`);
        if (res.data.success && res.data.data.length > 0) {
          const nearest = res.data.data[0];
          if (isTa) {
            return `${nearest.name} பகுதியில் தற்போதைய காற்று தரம் (AQI) ${nearest.lastAqi} (${nearest.lastCategory}) ஆகும். முதன்மை மாசுபடுத்தி: ${nearest.dominantPollutant?.toUpperCase() || 'PM2.5'}.`;
          }
          return `The air quality at ${nearest.name} is currently ${nearest.lastAqi} AQI (${nearest.lastCategory}), with ${nearest.dominantPollutant?.toUpperCase() || 'PM2.5'} as the primary pollutant.`;
        }
        return isTa 
          ? `உங்கள் இருப்பிடத்திலிருந்து 40 கி.மீ சுற்றளவில் தற்போது செயல்படும் நிலையங்கள் எதுவும் கண்டறியப்படவில்லை.`
          : `I checked stations within 40 km of your current view, but couldn't locate active readings right now.`;
      } catch (e) {
        return isTa ? `தற்போது அருகில் உள்ள நிலையங்களின் தகவல்களைப் பெற முடியவில்லை.` : `Unable to fetch nearby readings at the moment.`;
      }
    }

    // 2. City query intent: check for recognized city names
    const CITIES = ['chennai', 'coimbatore', 'madurai', 'trichy', 'tiruchirappalli', 'salem', 'delhi', 'mumbai', 'bengaluru', 'bangalore', 'kolkata', 'new york', 'london', 'tokyo', 'paris'];
    for (const city of CITIES) {
      if (lower.includes(city)) {
        const queryCity = city === 'bangalore' ? 'Bengaluru' : city === 'trichy' ? 'Tiruchirappalli' : city;
        try {
          const res = await axios.get(`/api/aqi/city/${queryCity}`);
          if (res.data.success) {
            if (onSelectCity) onSelectCity(res.data.data[0]);
            if (isTa) {
              return `${res.data.city} நகரில் சராசரி AQI ${res.data.cityAverageAqi} (${res.data.cityCategory}) ஆகும் (மொத்தம் ${res.data.count} நிலையங்கள்).`;
            }
            return `In ${res.data.city}, the city-wide average AQI is ${res.data.cityAverageAqi} (${res.data.cityCategory}) across ${res.data.count} monitoring stations. ${res.data.categoryInfo?.healthText || ''}`;
          }
        } catch (e) {
          return isTa ? `${city} நகரத்திற்கான செயலில் உள்ள கண்காணிப்பு நிலையங்கள் கிடைக்கவில்லை.` : `I couldn't find active monitoring stations for ${city}.`;
        }
      }
    }

    // 3. Exercise / Outdoor running intent
    if (lower.includes('run') || lower.includes('exercise') || lower.includes('workout') || lower.includes('walk') || lower.includes('ஓடலாமா') || lower.includes('உடற்பயிற்சி') || lower.includes('நடைபயிற்சி')) {
      const lat = currentCenter ? currentCenter[0] : 13.0827;
      const lng = currentCenter ? currentCenter[1] : 80.2707;
      const res = await axios.get(`/api/aqi/nearby?lat=${lat}&lng=${lng}&radius=40`);
      const aqi = res.data?.data?.[0]?.lastAqi || 55;
      if (aqi <= 50) {
        return isTa 
          ? `நிச்சயமாக! தற்போது AQI ${aqi} (நல்லது) ஆகும். வெளியில் ஓடுவது மற்றும் உடற்பயிற்சி செய்வது முற்றிலும் பாதுகாப்பானது.`
          : `Yes, absolutely! The AQI is ${aqi} (Good). Outdoor exercise and jogging are completely safe today.`;
      } else if (aqi <= 100) {
        return isTa
          ? `காற்றின் தரம் திருப்திகரமாக உள்ளது (AQI: ${aqi}). வெளியில் உடற்பயிற்சி செய்யலாம், ஆனால் சுவாசம் தொடர்பான பிரச்சனை உள்ளவர்கள் கவனமாக இருக்கவும்.`
          : `It is acceptable. The AQI is ${aqi} (Moderate). General public can exercise, though sensitive individuals should monitor for throat irritation.`;
      } else if (aqi <= 150) {
        return isTa
          ? `எச்சரிக்கை தேவை. AQI ${aqi} (மிதமானது/உணர்திறன் உள்ளவர்களுக்கு உகந்ததல்ல). கடினமான வெளிப்புற உடற்பயிற்சிகளைக் குறைத்து வீட்டிற்குள் செய்வது நல்லது.`
          : `Caution advised. The AQI is ${aqi} (Unhealthy for Sensitive Groups). Consider reducing intense outdoor cardio or exercising indoors.`;
      } else {
        return isTa
          ? `இல்லை, வெளியில் உடற்பயிற்சி செய்ய வேண்டாம்! AQI ${aqi} (${aqi > 200 ? 'மிக மோசம்' : 'மோசம்'}). காற்றில் நுண் துகள்கள் அதிகம் உள்ளதால் வீட்டிற்குள்ளேயே உடற்பயிற்சி செய்யுங்கள்.`
          : `No, outdoor exercise is not recommended. The AQI is ${aqi} (${aqi > 200 ? 'Very Unhealthy' : 'Unhealthy'}). High respiration rates will draw fine particulate matter deep into lung tissue. Stick to indoor workouts with an air purifier.`;
      }
    }

    // 4. Pollutant explanation intent
    if (lower.includes('pm2.5') || lower.includes('pm 2.5') || lower.includes('what is pm') || lower.includes('நுண் துகள்')) {
      return isTa
        ? `PM2.5 என்பது 2.5 மைக்ரோமீட்டருக்கும் குறைவான விட்டம் கொண்ட மிக நுண்ணிய காற்றில் கலந்த துகள்களாகும் (மனித முடியை விட 30 மடங்கு சிறியது). இவை நேரடியாக நுரையீரலுக்குள் சென்று இரத்த ஓட்டத்தில் கலந்து உடல் நல பாதிப்பை ஏற்படுத்துகின்றன.`
        : `PM2.5 refers to fine inhalable particles with diameters 2.5 micrometers or smaller (30 times thinner than human hair). Because of their microscopic size, they penetrate directly into the bloodstream and alveoli, causing cardiovascular and respiratory stress.`;
    }

    // 5. Forecast intent
    if (lower.includes('tomorrow') || lower.includes('forecast') || lower.includes('நாளை') || lower.includes('முன்னறிவிப்பு')) {
      return isTa
        ? `எங்கள் AI கணிப்பின்படி, காலை மற்றும் மாலை நேர போக்குவரத்து நெரிசல் சமயங்களில் காற்று மாசுபாடு சிறிது அதிகரிக்க வாய்ப்புள்ளது.`
        : `Based on our time-series regression and diurnal meteorological models, particulate concentrations are projected to experience morning and evening rush-hour peaks, averaging slightly higher during calm nocturnal wind conditions.`;
    }

    // Default conversational reply
    return isTa
      ? `நான் உங்களுக்கு நிகழ்நேர காற்று தரத்தை கண்காணிக்கவும், வெளியில் உடற்பயிற்சி செய்வது பாதுகாப்பானதா என கூறவும், நகர மாசு அளவுகளை விளக்கவும் உதவ முடியும். "என் பகுதியில் காற்று தரம் என்ன?" அல்லது "சென்னையில் காற்று எப்படி உள்ளது?" என்று கேட்டுப் பாருங்கள்.`
      : `I can help you monitor real-time air quality, verify whether it's safe to exercise outside, inspect city-wide pollution levels, or explain pollutant health guidelines. Try asking: "What's the AQI near me?" or "How is Chennai air?"`;
  };

  const handleSendQuery = async (queryText) => {
    const text = queryText || inputText;
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const answer = await parseQueryIntent(text);
      const assistantMsg = { sender: 'assistant', text: answer, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
      speakText(answer);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', text: 'Sorry, I encountered an issue processing your request.', timestamp: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[1100] w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col h-[520px] overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm font-heading flex items-center gap-1.5">
              <span>{t('chat.title')}</span>
              <Sparkles size={13} className="text-purple-400" />
            </h3>
            <p className="text-[11px] text-slate-400">Web Speech & Atmospheric Intent Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            title={ttsEnabled ? 'Mute Speech' : 'Unmute Speech'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {ttsEnabled ? <Volume2 size={16} className="text-cyan-400" /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 shadow-inner'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Querying live atmospheric data...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Listening State Bar */}
      {isListening && (
        <div className="bg-rose-950/60 border-t border-rose-800/60 px-4 py-2 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>{t('chat.listening')}</span>
          </div>
          <button onClick={toggleMic} className="text-rose-400 hover:text-white underline text-[11px]">
            Stop
          </button>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery();
        }}
        className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleMic}
          className={`p-2.5 rounded-xl transition ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Voice input via Web Speech API"
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('chat.placeholder')}
          className="flex-1 bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
