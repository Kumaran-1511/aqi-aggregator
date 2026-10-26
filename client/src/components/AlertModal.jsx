import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { X, Bell, ShieldAlert, CheckCircle2, Trash2, AlertTriangle, ArrowRight, MapPin, Radio } from 'lucide-react';
import { getAQIColor, getAQILevel } from '../utils/aqiColors';

export default function AlertModal({
  isOpen,
  onClose,
  stations = [],
  currentCenter,
  onSelectStation
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('citizen.alert@aqi.in');
  const [label, setLabel] = useState('My Neighborhood');
  const [threshold, setThreshold] = useState(150);
  const [radiusKm, setRadiusKm] = useState(15);
  const [statusMessage, setStatusMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [myAlerts, setMyAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'subscribe'

  const currentLevel = getAQILevel(threshold);

  // Live stations exceeding hazardous or unhealthy thresholds
  const liveBreaches = useMemo(() => {
    return stations
      .filter(s => (s.lastAqi || 0) >= 120)
      .sort((a, b) => (b.lastAqi || 0) - (a.lastAqi || 0));
  }, [stations]);

  const fetchAlerts = async (queryEmail) => {
    try {
      const res = await axios.get(`/api/alerts${queryEmail ? `?email=${queryEmail}` : ''}`);
      if (res.data.success) {
        setMyAlerts(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to load alerts:', e.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts(email);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    const lat = currentCenter ? currentCenter[0] : 28.6139;
    const lng = currentCenter ? currentCenter[1] : 77.2090;

    try {
      const res = await axios.post('/api/alerts/subscribe', {
        email: email || 'citizen.alert@aqi.in',
        label: label || 'My Neighborhood',
        lat,
        lng,
        thresholdAqi: threshold,
        radiusKm: radiusKm || 15,
        notifyMethod: 'email'
      });

      if (res.data.success) {
        setStatusMessage({
          type: 'success',
          text: `Alert registered successfully for threshold ${threshold} AQI!`
        });
        fetchAlerts(email);
        setTimeout(() => setActiveTab('live'), 1500);
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to subscribe alert'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/alerts/${id}`);
      fetchAlerts(email);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden animate-slide-up text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Bell size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-heading">
              Air Quality Alerts & Live Warnings
            </h3>
            <p className="text-xs text-slate-400">
              Real-time high pollution monitoring and regional threshold alerts across India
            </p>
          </div>
        </div>

        {/* Tab Switcher: Live Warnings vs Create Alert */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-4 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio size={14} className={liveBreaches.length > 0 ? 'text-rose-300 animate-pulse' : ''} />
            <span>Active Live Warnings ({liveBreaches.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscribe')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'subscribe'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell size={14} />
            <span>Set New Alert Subscription</span>
          </button>
        </div>

        {/* TAB 1: Live Active Warnings across India */}
        {activeTab === 'live' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Stations currently exceeding safe air quality standards (AQI ≥ 120):</span>
              <span className="font-bold text-amber-400">{liveBreaches.length} Alerts Active</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {liveBreaches.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-200">All Monitoring Stations Within Safe Limits</p>
                  <p className="text-xs text-slate-500 mt-1">No stations currently exceed AQI 120 threshold.</p>
                </div>
              ) : (
                liveBreaches.map((st) => {
                  const lvl = getAQILevel(st.lastAqi);
                  return (
                    <div
                      key={st.stationId || st._id}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-black font-heading text-white text-sm shrink-0 shadow-sm"
                          style={{ backgroundColor: lvl.color }}
                        >
                          {Math.round(st.lastAqi || 0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-white">{st.name}</h5>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase"
                              style={{ backgroundColor: lvl.color }}
                            >
                              {lvl.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-slate-500" />
                            <span>{st.city}, {st.state || 'India'} • Source: {st.source || 'CPCB'}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectStation) onSelectStation(st);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <span>View</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Set New Alert Subscription */}
        {activeTab === 'subscribe' && (
          <div>
            {statusMessage && (
              <div
                className={`p-3 rounded-xl mb-3 text-xs font-semibold flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Notification Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-4 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Location Label
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* AQI Threshold Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    AQI Alert Threshold
                  </label>
                  <span
                    className="text-xs font-bold font-heading px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: currentLevel.color }}
                  >
                    {threshold} AQI ({currentLevel.name})
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="350"
                  step="10"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-semibold">
                  <span>50 (Good)</span>
                  <span>100 (Satisfactory)</span>
                  <span>150 (Sensitive)</span>
                  <span>200 (Poor)</span>
                  <span>300+ (Severe)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 font-bold text-white text-xs shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bell size={15} />
                <span>{submitting ? 'Subscribing...' : 'Subscribe to Alert'}</span>
              </button>
            </form>

            {/* Active Subscriptions */}
            {myAlerts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Active Subscriptions ({myAlerts.length})
                </h4>
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {myAlerts.map(a => (
                    <div
                      key={a._id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">{a.label}</span>
                        <span className="text-slate-400 text-[10px]">
                          Threshold: {a.thresholdAqi} AQI • Radius: {a.radiusKm} km
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(a._id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
