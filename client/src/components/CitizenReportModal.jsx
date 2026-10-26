import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { X, Flame, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';

export default function CitizenReportModal({ isOpen, onClose, currentCenter, onReportCreated }) {
  const { t } = useTranslation();
  const [reportedBy, setReportedBy] = useState('');
  const [category, setCategory] = useState('smoke');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    const lat = currentCenter ? currentCenter[0] : 28.6139;
    const lng = currentCenter ? currentCenter[1] : 77.2090;

    try {
      const res = await axios.post('/api/reports', {
        reportedBy: reportedBy || 'Local Citizen',
        category,
        severity,
        description,
        lat,
        lng,
        address: `Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });

      if (res.data.success) {
        setStatusMessage({ type: 'success', text: t('citizenReport.success') });
        setDescription('');
        if (onReportCreated) onReportCreated(res.data.data);
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 1200);
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to submit report'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Flame size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-heading">{t('citizenReport.title')}</h3>
            <p className="text-xs text-slate-400">{t('citizenReport.subtitle')}</p>
          </div>
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success' ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}>
            <CheckCircle2 size={16} />
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Contributor Name (Optional)
            </label>
            <input
              type="text"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="e.g. Rahul S. / Anonymous"
              className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('citizenReport.category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-500"
              >
                <option value="smoke">Smoke / Smog</option>
                <option value="garbage_burning">Garbage Burning</option>
                <option value="industrial_odor">Chemical / Factory Odor</option>
                <option value="dust_construction">Construction Dust</option>
                <option value="vehicle_exhaust">Vehicle Exhaust</option>
                <option value="other">Other Anomaly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Perceived Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-500"
              >
                <option value="low">Low (Mild smell)</option>
                <option value="medium">Medium (Noticeable haze)</option>
                <option value="high">High (Eye irritation / dense)</option>
                <option value="severe">Severe (Choking / heavy smoke)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t('citizenReport.description')}
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the source, color, smell, or street landmarks..."
              className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400">
            <MapPin size={15} className="text-rose-400 shrink-0" />
            <span>Pinned to map position: {currentCenter ? `${currentCenter[0].toFixed(3)}, ${currentCenter[1].toFixed(3)}` : 'Current view'}</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 font-bold text-white text-sm shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2"
          >
            <Flame size={16} />
            <span>{submitting ? 'Publishing...' : t('citizenReport.submit')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
