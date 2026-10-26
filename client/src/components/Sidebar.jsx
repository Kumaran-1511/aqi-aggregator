import React from 'react';
import {
  LayoutDashboard,
  Map,
  Radio,
  BarChart3,
  GitCompare,
  History,
  Heart,
  Bell,
  Info,
  Settings,
  Leaf,
  Globe2
} from 'lucide-react';

export default function Sidebar({
  activeTab = 'dashboard',
  setActiveTab
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'stations', label: 'Monitoring Stations', icon: Radio },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'compare', label: 'Compare Locations', icon: GitCompare },
    { id: 'history', label: 'Historical Records', icon: History },
    { id: 'health', label: 'Health Guidance', icon: Heart },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'about', label: 'About', icon: Info },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-[230px] shrink-0 bg-[#0B132B] h-screen flex flex-col justify-between select-none z-20 text-slate-300">
      {/* Top Section: Brand & Nav */}
      <div>
        {/* Brand Header */}
        <div className="p-5 pb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Leaf size={22} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white font-heading tracking-tight leading-tight">
              AQI Map
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Breathe Better, Live Better</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition text-left ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card */}
      <div className="p-4">
        <div className="bg-[#16203A] border border-slate-700/60 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-600/40 text-blue-400 flex items-center justify-center shrink-0">
            <Globe2 size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">Cleaner Air</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Healthier Tomorrow.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
