import React from 'react';
import { Bell } from 'lucide-react';

export default function Header({
  pageTitle = 'Real-Time AQI Aggregator & Mapping System',
  lastUpdated = new Date(),
  alertCount = 0,
  onOpenAlerts,
  onOpenAdmin
}) {
  const now = lastUpdated ? new Date(lastUpdated) : new Date();
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(now);

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
      {/* Left Title */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 font-heading tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Right Cluster */}
      <div className="flex items-center gap-4">
        {/* Live Data Badge with Red Dot */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm animate-pulse"></span>
          <span>Live Telemetry</span>
        </div>

        {/* Last updated timestamp */}
        <div className="text-xs text-slate-500 font-normal hidden sm:block">
          Last updated: <span className="text-slate-700 font-medium">{formattedDate}</span>
        </div>

        {/* Bell Icon with Alert Count Badge */}
        <button
          onClick={onOpenAlerts}
          className="relative text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition"
          title={alertCount > 0 ? `${alertCount} Active Alerts` : 'Air Quality Alerts'}
        >
          <Bell size={18} />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
              {alertCount}
            </span>
          )}
        </button>

        {/* User Avatar Circle with "U" */}
        <button
          onClick={onOpenAdmin}
          className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center hover:ring-2 hover:ring-blue-400 transition shadow-sm"
          title="User Account / Admin"
        >
          U
        </button>
      </div>
    </header>
  );
}
