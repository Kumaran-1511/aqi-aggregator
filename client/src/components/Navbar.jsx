import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wind,
  Search,
  Crosshair,
  Bell,
  AlertTriangle,
  Layers,
  Flame,
  Radio,
  RefreshCw,
  Globe,
  Shield,
  Bot
} from 'lucide-react';

export default function Navbar({
  socketConnected,
  onSearchCity,
  onLocateMe,
  onRefreshData,
  showHeatmap,
  setShowHeatmap,
  showStations,
  setShowStations,
  showReports,
  setShowReports,
  onOpenAlertModal,
  onOpenReportModal,
  onOpenAdmin,
  onOpenChat
}) {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearchCity(searchTerm.trim());
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className="relative z-20 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-xl">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Wind className="text-white" size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-white font-heading tracking-tight">{t('appName')}</h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
              {socketConnected ? 'LIVE SOCKET.IO' : 'OFFLINE'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">{t('tagline')}</p>
        </div>
      </div>

      {/* Search & Location Bar */}
      <div className="flex-1 max-w-md mx-4">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-slate-950/80 border border-slate-700/80 text-xs sm:text-sm text-slate-100 rounded-xl pl-9 pr-24 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition placeholder:text-slate-500"
          />
          <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
          
          <button
            type="button"
            onClick={onLocateMe}
            title={t('nearMe')}
            className="absolute right-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white text-xs flex items-center gap-1 transition"
          >
            <Crosshair size={13} className="text-cyan-400" />
            <span className="hidden lg:inline">{t('nearMe')}</span>
          </button>
        </form>
      </div>

      {/* Controls & Modals */}
      <div className="flex items-center gap-2">
        {/* Layer Toggles */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-950/60 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setShowStations(!showStations)}
            className={`px-2.5 py-1 rounded-lg transition font-medium ${
              showStations ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Stations
          </button>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1 rounded-lg transition font-medium ${
              showHeatmap ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setShowReports(!showReports)}
            className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
              showReports ? 'bg-slate-800 text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Flame size={12} />
            Citizen Reports
          </button>
        </div>

        {/* Refresh data */}
        <button
          onClick={handleRefresh}
          title={t('refresh')}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
        </button>

        {/* Set Alert Modal Button */}
        <button
          onClick={onOpenAlertModal}
          title={t('alerts.title')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold transition"
        >
          <Bell size={14} className="text-amber-400" />
          <span>Alerts</span>
        </button>

        {/* Report Smoke / Citizen Science */}
        <button
          onClick={onOpenReportModal}
          title={t('citizenReport.title')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
        >
          <Flame size={14} className="text-rose-400" />
          <span className="hidden sm:inline">Report Smoke</span>
        </button>

        {/* AI Voice Assistant Trigger */}
        <button
          onClick={onOpenChat}
          title={t('chat.title')}
          className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 hover:opacity-90 text-white shadow-md shadow-purple-900/30 transition flex items-center gap-1 text-xs font-bold"
        >
          <Bot size={16} />
          <span className="hidden md:inline">AeroAI</span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          title="Switch Language (English / தமிழ்)"
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1"
        >
          <Globe size={13} className="text-emerald-400" />
          <span>{i18n.language === 'en' ? 'தமிழ்' : 'EN'}</span>
        </button>

        {/* Admin Dashboard */}
        <button
          onClick={onOpenAdmin}
          title={t('admin.title')}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition"
        >
          <Shield size={16} />
        </button>
      </div>
    </header>
  );
}
