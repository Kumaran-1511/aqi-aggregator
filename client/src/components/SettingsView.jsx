import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Globe, Bell, Wifi, RefreshCw } from 'lucide-react';

export default function SettingsView({ onRefreshAll }) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          System Preferences & Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize regional localization, telemetry polling cadence, and notification preferences.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm">
        {/* Language Selection */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Globe size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Regional Language</h4>
              <p className="text-xs text-slate-500">Toggle between English and Tamil for all UI strings and health advisories.</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-1.5 rounded-md transition ${
                i18n.language === 'en' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('ta')}
              className={`px-3 py-1.5 rounded-md transition ${
                i18n.language === 'ta' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ் (Tamil)
            </button>
          </div>
        </div>

        {/* Polling Interval & Ingestion */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <RefreshCw size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Background Polling Cadence</h4>
              <p className="text-xs text-slate-500">External API querying schedule via server node-cron.</p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
            Every 30 Minutes (Cached)
          </span>
        </div>

        {/* Offline PWA Capabilities */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Wifi size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Offline PWA & Service Worker</h4>
              <p className="text-xs text-slate-500">Caches last-known telemetry for offline operation during network loss.</p>
            </div>
          </div>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
            Enabled & Active
          </span>
        </div>
      </div>
    </div>
  );
}
