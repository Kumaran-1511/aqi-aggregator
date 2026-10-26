import React from 'react';
import { Leaf, Wind, AlertTriangle, MapPin, Database, ShieldCheck } from 'lucide-react';
import { getAQILevel } from '../utils/aqiColors';

function getCardStyle(aqi) {
  const v = Number(aqi) || 0;
  if (v <= 50) {
    return {
      cardBg: 'bg-[#EAF7EE] border-[#C6EED0]',
      iconBg: 'bg-emerald-100/90 text-emerald-600',
      iconFill: 'fill-emerald-600/30',
      textColor: 'text-emerald-700'
    };
  }
  if (v <= 100) {
    return {
      cardBg: 'bg-[#F4FBEA] border-[#D8F3B8]',
      iconBg: 'bg-lime-100/90 text-lime-600',
      iconFill: 'fill-lime-600/30',
      textColor: 'text-lime-700'
    };
  }
  if (v <= 150) {
    return {
      cardBg: 'bg-[#FFF9E6] border-[#FBE5A2]',
      iconBg: 'bg-amber-100/90 text-amber-500',
      iconFill: 'fill-amber-500/20',
      textColor: 'text-amber-700'
    };
  }
  if (v <= 200) {
    return {
      cardBg: 'bg-[#FDEEEB] border-[#F7C3BD]',
      iconBg: 'bg-rose-100/90 text-rose-500',
      iconFill: 'fill-rose-500/20',
      textColor: 'text-rose-700'
    };
  }
  return {
    cardBg: 'bg-[#F6EEFD] border-[#E1CAFA]',
    iconBg: 'bg-purple-100/90 text-purple-600',
    iconFill: 'fill-purple-600/20',
    textColor: 'text-purple-700'
  };
}

export default function StatCards({ stations = [], currentState = 'All India', currentCity = 'All Cities' }) {
  // Filter stations based on selected state and city scope
  const scopedStations = stations.filter(s => {
    const matchCountry = s.country === 'IN' && s.state !== 'International';
    const matchState = currentState === 'All India' || (s.state && s.state.toLowerCase() === currentState.toLowerCase());
    const matchCity = currentCity === 'All Cities' || (s.city && s.city.toLowerCase() === currentCity.toLowerCase());
    return matchCountry && matchState && matchCity;
  });

  const activeSet = scopedStations.length > 0 ? scopedStations : stations;
  const activeCount = activeSet.length;

  // Compute dynamic stats
  const totalAqi = activeSet.reduce((acc, curr) => acc + (curr.lastAqi || 0), 0);
  const avgAqi = activeCount > 0 ? Math.round(totalAqi / activeCount) : 0;
  const highestAqi = activeCount > 0 ? Math.max(...activeSet.map(s => s.lastAqi || 0)) : 0;

  // National baseline AQI
  const nationalStations = stations.filter(s => s.country === 'IN');
  const nationalAvg = nationalStations.length > 0
    ? Math.round(nationalStations.reduce((a, b) => a + (b.lastAqi || 0), 0) / nationalStations.length)
    : 110;

  // Level info
  const avgLevel = getAQILevel(avgAqi);
  const highestLevel = getAQILevel(highestAqi);
  const nationalLevel = getAQILevel(nationalAvg);

  const avgTheme = getCardStyle(avgAqi);
  const peakTheme = getCardStyle(highestAqi);
  const nationalTheme = getCardStyle(nationalAvg);

  // Distinct sources
  const sourceCount = new Set(stations.map(s => (s.source || 'CPCB').toLowerCase())).size || 2;

  const scopeLabel = currentCity !== 'All Cities'
    ? currentCity
    : (currentState !== 'All India' ? currentState : 'All India');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 px-6 pt-5 pb-2">
      {/* 1. Scoped Average AQI - Dynamically themed */}
      <div className={`${avgTheme.cardBg} border rounded-xl p-4 shadow-sm flex items-center gap-3.5 transition-colors duration-200`}>
        <div className={`w-11 h-11 rounded-full ${avgTheme.iconBg} flex items-center justify-center shrink-0`}>
          {avgAqi <= 100 ? <Leaf size={22} className={avgTheme.iconFill} /> : <AlertTriangle size={22} className={avgTheme.iconFill} />}
        </div>
        <div>
          <span className="text-2xl font-black text-slate-900 font-heading leading-tight block">
            {avgAqi}
          </span>
          <span className={`text-xs font-bold block -mt-0.5 ${avgTheme.textColor}`}>
            {avgLevel.name}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Average AQI ({scopeLabel})
          </span>
        </div>
      </div>

      {/* 2. National / All India Average AQI */}
      <div className={`${nationalTheme.cardBg} border rounded-xl p-4 shadow-sm flex items-center gap-3.5`}>
        <div className={`w-11 h-11 rounded-full ${nationalTheme.iconBg} flex items-center justify-center shrink-0`}>
          <Wind size={22} />
        </div>
        <div>
          <span className="text-2xl font-black text-slate-900 font-heading leading-tight block">
            {nationalAvg}
          </span>
          <span className={`text-xs font-bold block -mt-0.5 ${nationalTheme.textColor}`}>
            {nationalLevel.name}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            All India Baseline
          </span>
        </div>
      </div>

      {/* 3. Highest AQI In Scope - Dynamically themed */}
      <div className={`${peakTheme.cardBg} border rounded-xl p-4 shadow-sm flex items-center gap-3.5 transition-colors duration-200`}>
        <div className={`w-11 h-11 rounded-full ${peakTheme.iconBg} flex items-center justify-center shrink-0`}>
          {highestAqi <= 100 ? <ShieldCheck size={22} /> : <AlertTriangle size={22} className={peakTheme.iconFill} />}
        </div>
        <div>
          <span className="text-2xl font-black text-slate-900 font-heading leading-tight block">
            {highestAqi}
          </span>
          <span className={`text-xs font-bold block -mt-0.5 ${peakTheme.textColor}`}>
            {highestLevel.name}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Peak AQI ({scopeLabel})
          </span>
        </div>
      </div>

      {/* 4. Active Monitoring Locations */}
      <div className="bg-[#EEF6FF] border border-[#CCE3FE] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-blue-100/90 text-blue-600 flex items-center justify-center shrink-0">
          <MapPin size={22} className="text-blue-600 fill-blue-600/20" />
        </div>
        <div>
          <span className="text-2xl font-black text-slate-900 font-heading leading-tight block">
            {activeCount}
          </span>
          <span className="text-xs font-bold text-blue-700 block -mt-0.5">
            Stations in Scope
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {stations.length} Active Across India
          </span>
        </div>
      </div>

      {/* 5. Ingestion Data Sources */}
      <div className="bg-[#F5F0FF] border border-[#DDCFFC] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-purple-100/90 text-purple-600 flex items-center justify-center shrink-0">
          <Database size={22} className="text-purple-600" />
        </div>
        <div>
          <span className="text-2xl font-black text-slate-900 font-heading leading-tight block">
            {sourceCount}
          </span>
          <span className="text-xs font-bold text-purple-700 block -mt-0.5">
            Active Data Sources
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            CPCB Data.gov + WAQI Bounds
          </span>
        </div>
      </div>
    </div>
  );
}
