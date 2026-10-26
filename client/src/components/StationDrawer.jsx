import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  X,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  Activity,
  Calendar,
  AlertTriangle,
  Wind,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { getAQIColor, getAQILevel } from '../utils/aqiColors';

export default function StationDrawer({ station, onClose }) {
  const { t, i18n } = useTranslation();
  const [range, setRange] = useState('24h');
  const [historyData, setHistoryData] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'forecast'

  const currentLevel = getAQILevel(station?.lastAqi || 0);

  // Fetch historical readings whenever station or range changes
  useEffect(() => {
    if (!station) return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await axios.get(`/api/aqi/history/${station.stationId}?range=${range}`);
        if (res.data.success) {
          const formatted = res.data.data.map(item => ({
            timestamp: item.timestamp,
            timeLabel: range === '24h'
              ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            aqi: item.aqi,
            pm25: item.pollutants?.pm25 || 0,
            pm10: item.pollutants?.pm10 || 0,
            no2: item.pollutants?.no2 || 0
          }));
          setHistoryData(formatted);
        }
      } catch (err) {
        console.error('History fetch failed:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [station, range]);

  // Fetch forecast data
  useEffect(() => {
    if (!station) return;
    const fetchForecast = async () => {
      setLoadingForecast(true);
      try {
        const res = await axios.get(`/api/forecast/${station.stationId}?hours=24`);
        if (res.data.success) {
          setForecastData(res.data.forecast);
        }
      } catch (err) {
        console.error('Forecast fetch failed:', err);
      } finally {
        setLoadingForecast(false);
      }
    };

    fetchForecast();
  }, [station]);

  if (!station) return null;

  const pollutantItems = [
    { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', value: station.latest?.pollutants?.pm25 ?? '--', color: '#10b981' },
    { key: 'pm10', label: 'PM10', unit: 'µg/m³', value: station.latest?.pollutants?.pm10 ?? '--', color: '#3b82f6' },
    { key: 'no2', label: 'NO2', unit: 'µg/m³', value: station.latest?.pollutants?.no2 ?? '--', color: '#f59e0b' },
    { key: 'so2', label: 'SO2', unit: 'µg/m³', value: station.latest?.pollutants?.so2 ?? '--', color: '#8b5cf6' },
    { key: 'co', label: 'CO', unit: 'mg/m³', value: station.latest?.pollutants?.co ?? '--', color: '#06b6d4' },
    { key: 'o3', label: 'O3', unit: 'µg/m³', value: station.latest?.pollutants?.o3 ?? '--', color: '#ec4899' },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-[1000] w-full max-w-xl bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col transition-all duration-300 animate-slide-up">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {station.source?.toUpperCase() || 'CPCB'}
            </span>
            <span className="text-xs text-slate-400">
              {station.city}, {station.country}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-heading">{station.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          aria-label={t('drawer.close')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Main AQI Hero Card */}
        <div
          className="rounded-2xl p-5 border relative overflow-hidden shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${currentLevel.color}22 0%, rgba(15, 23, 42, 0.95) 100%)`,
            borderColor: `${currentLevel.color}55`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">{t('drawer.currentAqi')}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-extrabold text-white font-heading">{station.lastAqi}</span>
                <span className="text-sm font-medium text-slate-400">US EPA Standard</span>
              </div>
              <p className="mt-2 text-base font-semibold" style={{ color: currentLevel.color }}>
                {i18n.language === 'ta' ? (currentLevel.tamil || currentLevel.name) : station.lastCategory}
              </p>
            </div>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"
              style={{ backgroundColor: `${currentLevel.color}25`, border: `2px solid ${currentLevel.color}` }}
            >
              <Wind size={32} style={{ color: currentLevel.color }} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>{t('drawer.primaryPollutant')}: <strong className="text-white uppercase">{station.dominantPollutant || 'PM2.5'}</strong></span>
            <span>{new Date(station.lastUpdated || Date.now()).toLocaleTimeString()}</span>
          </div>

          {/* Health guidance alert */}
          <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-xs text-slate-300 leading-relaxed">
              {t(`healthAdvice.${currentLevel.name.toLowerCase().replace(/ /g, '')}`, {
                defaultValue: 'Members of sensitive groups should limit outdoor physical exertion.'
              })}
            </p>
          </div>
        </div>

        {/* 6-Pollutant Grid */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" />
            Pollutant Concentration Matrix
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {pollutantItems.map(p => (
              <div key={p.key} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-2.5 text-center">
                <span className="text-xs text-slate-400 block font-medium">{p.label}</span>
                <span className="text-lg font-bold text-white mt-1 block font-heading">{p.value}</span>
                <span className="text-[10px] text-slate-500">{p.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trends & Forecast Navigation Tabs */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'history' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('drawer.historicalTrends')}
              </button>
              <button
                onClick={() => setActiveTab('forecast')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'forecast' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={14} />
                {t('drawer.forecastNext24h')}
              </button>
            </div>

            {activeTab === 'history' && (
              <div className="flex bg-slate-800/80 rounded-lg p-0.5 text-xs border border-slate-700">
                {['24h', '7d', '30d'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-2.5 py-1 rounded-md transition ${
                      range === r ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab 1: Historical Recharts */}
          {activeTab === 'history' && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
              {loadingHistory ? (
                <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                  Loading time-series data...
                </div>
              ) : historyData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-xs text-slate-500">
                  No readings available for this interval.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={currentLevel.color} stopOpacity={0.6}/>
                          <stop offset="95%" stopColor={currentLevel.color} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#fff'
                        }}
                      />
                      <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Moderate', fill: '#f59e0b', fontSize: 10 }} />
                      <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Unhealthy', fill: '#ef4444', fontSize: 10 }} />
                      <Area type="monotone" dataKey="aqi" stroke={currentLevel.color} strokeWidth={2.5} fillOpacity={1} fill="url(#aqiGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Forecast Curve */}
          {activeTab === 'forecast' && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
              {loadingForecast ? (
                <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                  Generating AI predictive time-series regression...
                </div>
              ) : forecastData ? (
                <>
                  <div className="flex items-center justify-between text-xs bg-purple-950/30 border border-purple-800/40 rounded-xl p-3">
                    <div>
                      <span className="text-purple-300 block font-semibold">Predicted 24h Average:</span>
                      <span className="text-xl font-bold text-white font-heading">{forecastData.nextDayAverageAqi} AQI</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Trajectory:</span>
                      <span className="text-sm font-semibold capitalize text-purple-400">{forecastData.trend}</span>
                    </div>
                  </div>

                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={forecastData.predictions?.map(p => ({
                          time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          predicted: p.predictedAqi,
                          lower: p.lowerBound,
                          upper: p.upperBound
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#8b5cf6',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#fff'
                          }}
                        />
                        <Area type="monotone" dataKey="upper" stroke="none" fill="#8b5cf6" fillOpacity={0.15} />
                        <Area type="monotone" dataKey="predicted" stroke="#c084fc" strokeWidth={2.5} fill="#8b5cf6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Info size={13} className="text-purple-400" />
                    Model incorporates diurnal traffic cycles & 7-day weighted momentum regression.
                  </p>
                </>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-500">
                  Forecast unavailable for this station.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Export Center */}
        <div className="border-t border-slate-800 pt-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Download size={16} className="text-emerald-400" />
            {t('drawer.exportReport')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`${import.meta.env.VITE_API_URL || ''}/api/export/${station.stationId}?format=csv&range=${range}`}
              download
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition"
            >
              <FileSpreadsheet size={16} className="text-emerald-400" />
              {t('drawer.exportCsv')}
            </a>
            <a
              href={`${import.meta.env.VITE_API_URL || ''}/api/export/${station.stationId}?format=pdf&range=${range}`}
              download
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition"
            >
              <FileText size={16} className="text-rose-400" />
              {t('drawer.exportPdf')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
