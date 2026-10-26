import React from 'react';
import { MapPin, ChevronDown, Heart, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { getAQILevel } from '../utils/aqiColors';

// Indian NAAQS Breakpoints for dynamic pollutant evaluations
function evaluatePollutant(type, val) {
  if (val === undefined || val === null || isNaN(val)) {
    return { status: '--', color: 'text-slate-400', bg: 'bg-slate-50' };
  }

  const v = Number(val);
  switch (type) {
    case 'pm25': // µg/m³
      if (v <= 30) return { status: 'Good', color: 'text-emerald-600', bg: 'bg-emerald-50/70' };
      if (v <= 60) return { status: 'Satisfactory', color: 'text-lime-600', bg: 'bg-lime-50/70' };
      if (v <= 90) return { status: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50/70' };
      if (v <= 120) return { status: 'Poor', color: 'text-orange-600', bg: 'bg-orange-50/70' };
      if (v <= 250) return { status: 'Very Poor', color: 'text-rose-600', bg: 'bg-rose-50/70' };
      return { status: 'Severe', color: 'text-red-700', bg: 'bg-red-100/70' };

    case 'pm10': // µg/m³
      if (v <= 50) return { status: 'Good', color: 'text-emerald-600', bg: 'bg-emerald-50/70' };
      if (v <= 100) return { status: 'Satisfactory', color: 'text-lime-600', bg: 'bg-lime-50/70' };
      if (v <= 250) return { status: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50/70' };
      if (v <= 350) return { status: 'Poor', color: 'text-orange-600', bg: 'bg-orange-50/70' };
      if (v <= 430) return { status: 'Very Poor', color: 'text-rose-600', bg: 'bg-rose-50/70' };
      return { status: 'Severe', color: 'text-red-700', bg: 'bg-red-100/70' };

    case 'no2': // µg/m³
      if (v <= 40) return { status: 'Good', color: 'text-emerald-600', bg: 'bg-emerald-50/70' };
      if (v <= 80) return { status: 'Satisfactory', color: 'text-lime-600', bg: 'bg-lime-50/70' };
      if (v <= 180) return { status: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50/70' };
      return { status: 'Poor', color: 'text-rose-600', bg: 'bg-rose-50/70' };

    case 'so2': // µg/m³
      if (v <= 40) return { status: 'Good', color: 'text-emerald-600', bg: 'bg-emerald-50/70' };
      if (v <= 80) return { status: 'Satisfactory', color: 'text-lime-600', bg: 'bg-lime-50/70' };
      return { status: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50/70' };

    case 'co': // mg/m³
      if (v <= 1.0) return { status: 'Good', color: 'text-emerald-600', bg: 'bg-emerald-50/70' };
      if (v <= 2.0) return { status: 'Satisfactory', color: 'text-lime-600', bg: 'bg-lime-50/70' };
      return { status: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50/70' };

    case 'o3': // µg/m³
      if (v <= 50) return { status: 'Good', color: 'text-emerald-600', bg: 'bg-emerald-50/70' };
      if (v <= 100) return { status: 'Satisfactory', color: 'text-lime-600', bg: 'bg-lime-50/70' };
      return { status: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50/70' };

    default:
      return { status: 'Normal', color: 'text-slate-600', bg: 'bg-slate-50' };
  }
}

// AQI Box color theme & dynamic health advice based on AQI value
function getAqiCardTheme(aqi) {
  const val = Number(aqi) || 0;
  if (val <= 50) {
    return {
      bg: 'bg-emerald-50 border-emerald-200',
      tagText: 'text-emerald-600',
      numColor: 'text-emerald-600',
      catColor: 'text-emerald-700',
      adviceColor: 'text-emerald-600',
      advice: 'Air quality is satisfactory. Enjoy outdoor activities.',
      guidanceTitle: 'Good Air Quality',
      guidanceDesc: 'Air quality poses little or no health risk. Ideal condition for all outdoor physical activities.',
      guidanceBg: 'bg-emerald-500',
      guidanceText: 'text-emerald-700'
    };
  }
  if (val <= 100) {
    return {
      bg: 'bg-lime-50 border-lime-200',
      tagText: 'text-lime-600',
      numColor: 'text-lime-600',
      catColor: 'text-lime-700',
      adviceColor: 'text-lime-700',
      advice: 'Air quality is acceptable for most people.',
      guidanceTitle: 'Satisfactory',
      guidanceDesc: 'Minor breathing discomfort possible for sensitive individuals. General population can carry on normal activities.',
      guidanceBg: 'bg-lime-500',
      guidanceText: 'text-lime-700'
    };
  }
  if (val <= 150) {
    return {
      bg: 'bg-amber-50 border-amber-200',
      tagText: 'text-amber-600',
      numColor: 'text-amber-600',
      catColor: 'text-amber-700',
      adviceColor: 'text-amber-700',
      advice: 'Sensitive groups should reduce prolonged outdoor exertion.',
      guidanceTitle: 'Moderate / Sensitive',
      guidanceDesc: 'People with respiratory or heart conditions, children, and elderly should limit heavy outdoor exertion.',
      guidanceBg: 'bg-amber-500',
      guidanceText: 'text-amber-700'
    };
  }
  if (val <= 200) {
    return {
      bg: 'bg-rose-50 border-rose-200',
      tagText: 'text-rose-500',
      numColor: 'text-rose-600',
      catColor: 'text-rose-700',
      adviceColor: 'text-rose-600',
      advice: 'Health risk for everyone. Avoid prolonged outdoor activities.',
      guidanceTitle: 'Unhealthy / Poor',
      guidanceDesc: 'Everyone may begin to experience breathing discomfort. Avoid heavy outdoor exercise. Wear an N95 mask.',
      guidanceBg: 'bg-rose-500',
      guidanceText: 'text-rose-700'
    };
  }
  if (val <= 300) {
    return {
      bg: 'bg-purple-50 border-purple-200',
      tagText: 'text-purple-600',
      numColor: 'text-purple-600',
      catColor: 'text-purple-700',
      adviceColor: 'text-purple-700',
      advice: 'Health alert: Serious risk of health effects for all.',
      guidanceTitle: 'Very Poor / Severe',
      guidanceDesc: 'Significant respiratory illness risk on prolonged exposure. Stay indoors and run air purification if available.',
      guidanceBg: 'bg-purple-600',
      guidanceText: 'text-purple-700'
    };
  }
  return {
    bg: 'bg-red-100 border-red-300',
    tagText: 'text-red-700',
    numColor: 'text-red-700',
    catColor: 'text-red-800',
    adviceColor: 'text-red-800',
    advice: 'Emergency warning: Entire population is at risk. Stay indoors.',
    guidanceTitle: 'Hazardous / Severe',
    guidanceDesc: 'Severe health impacts on everyone. Keep windows sealed, avoid any outdoor exposure, and seek medical attention if experiencing symptoms.',
    guidanceBg: 'bg-red-700',
    guidanceText: 'text-red-800'
  };
}

export default function LocationDetailsCard({
  station,
  stations = [],
  onSelectStation
}) {
  const currentStation = station || stations[0] || {
    name: 'Selected Station',
    city: 'City',
    state: 'State',
    lastAqi: 75,
    lastCategory: 'Satisfactory',
    source: 'CPCB',
    location: { coordinates: [77.5946, 12.9716] },
    pollutants: { pm25: 25, pm10: 55, no2: 22, so2: 8, co: 0.6, o3: 36 }
  };

  const aqiVal = currentStation.lastAqi || 0;
  const theme = getAqiCardTheme(aqiVal);
  const coords = currentStation.location?.coordinates || [77.5946, 12.9716];

  const pollutants = currentStation.pollutants || {
    pm25: 25,
    pm10: 55,
    no2: 22,
    so2: 8,
    co: 0.6,
    o3: 36
  };

  // Format current date and time cleanly
  const now = new Date();
  const formattedDateTime = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + ', ' + now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const displayStations = React.useMemo(() => {
    const scoped = currentStation?.state
      ? stations.filter(s => s.state && s.state.toLowerCase() === currentStation.state.toLowerCase())
      : stations;
    const pool = scoped.length > 0 ? scoped : stations;

    const seen = new Set();
    const result = [];
    for (const s of pool) {
      const key = `${(s.name || '').toLowerCase().trim()}::${(s.city || '').toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(s);
      }
    }
    return result;
  }, [stations, currentStation?.state]);

  const pollutantItems = [
    { name: 'PM2.5', val: pollutants.pm25 ?? '--', ...evaluatePollutant('pm25', pollutants.pm25) },
    { name: 'PM10', val: pollutants.pm10 ?? '--', ...evaluatePollutant('pm10', pollutants.pm10) },
    { name: 'NO₂', val: pollutants.no2 ?? '--', ...evaluatePollutant('no2', pollutants.no2) },
    { name: 'SO₂', val: pollutants.so2 ?? '--', ...evaluatePollutant('so2', pollutants.so2) },
    { name: 'CO', val: pollutants.co ?? '--', ...evaluatePollutant('co', pollutants.co) },
    { name: 'O₃', val: pollutants.o3 ?? '--', ...evaluatePollutant('o3', pollutants.o3) }
  ];

  return (
    <div className="space-y-3.5">
      {/* 1. Location Details Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
        {/* Header: Label + Station Select Dropdown neatly aligned */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 shrink-0">
            <MapPin size={15} className="text-slate-700" />
            <span>Location Details</span>
          </div>

          {/* Location Dropdown neatly constrained */}
          <div className="relative max-w-[210px] sm:max-w-[230px] w-full">
            <select
              value={currentStation.stationId || ''}
              onChange={(e) => {
                const target = stations.find(s => s.stationId === e.target.value);
                if (target && onSelectStation) onSelectStation(target);
              }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg py-1 pl-2.5 pr-6 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
              title="Select station location"
            >
              {displayStations.map(s => (
                <option key={s.stationId || s._id} value={s.stationId}>
                  {s.name}, {s.city}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Content: Left Dynamic Colored AQI Box + Right Details Table */}
        <div className="grid grid-cols-12 gap-3 items-stretch">
          {/* Dynamic Colored AQI Box changing with AQI value */}
          <div className={`col-span-5 rounded-xl border p-3 flex flex-col justify-between transition-colors duration-300 ${theme.bg}`}>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${theme.tagText}`}>
                AQI
              </span>
              <span className={`text-4xl font-black font-heading leading-tight block ${theme.numColor}`}>
                {Math.round(aqiVal)}
              </span>
              <span className={`text-xs font-bold block mt-0.5 ${theme.catColor}`}>
                {currentStation.lastCategory || getAQILevel(aqiVal).name}
              </span>
            </div>
            <p className={`text-[10px] font-medium leading-tight mt-2 ${theme.adviceColor}`}>
              {theme.advice}
            </p>
          </div>

          {/* Details Table */}
          <div className="col-span-7 flex flex-col justify-center space-y-1.5 text-[11px] pl-1">
            <div className="flex items-start justify-between">
              <span className="text-slate-400 font-medium">Location</span>
              <span className="font-semibold text-slate-800 text-right truncate max-w-[140px]" title={`${currentStation.name}, ${currentStation.city}`}>
                {currentStation.name}, {currentStation.city}
              </span>
            </div>
            {currentStation.state && (
              <div className="flex items-start justify-between">
                <span className="text-slate-400 font-medium">State</span>
                <span className="font-semibold text-slate-700 text-right">
                  {currentStation.state}
                </span>
              </div>
            )}
            <div className="flex items-start justify-between">
              <span className="text-slate-400 font-medium">Last Updated</span>
              <span className="font-medium text-slate-700 text-right">
                {formattedDateTime}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-400 font-medium">Source</span>
              <span className="font-semibold text-slate-800 text-right uppercase">
                {currentStation.source || 'CPCB'}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-400 font-medium">Coordinates</span>
              <span className="font-medium text-slate-700 text-right text-[10px]">
                {coords[1] ? coords[1].toFixed(4) : '--'}° N, {coords[0] ? coords[0].toFixed(4) : '--'}° E
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pollutant Levels (µg/m³) Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold text-slate-800">
            Pollutant Levels (µg/m³)
          </h4>
          <span className="text-[10px] text-slate-400 font-medium">
            CPCB NAAQS
          </span>
        </div>

        {/* 6 Pollutant Horizontal Tiles with Dynamic Status & Colors */}
        <div className="grid grid-cols-6 gap-1.5 text-center">
          {pollutantItems.map((p) => (
            <div
              key={p.name}
              className={`p-2 rounded-xl border border-slate-100 ${p.bg} flex flex-col justify-between`}
            >
              <span className="text-[10px] font-bold text-slate-600 block">{p.name}</span>
              <span className={`text-sm font-black font-heading my-0.5 ${p.color}`}>
                {p.val}
              </span>
              <span className={`text-[9px] font-bold ${p.color}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Health Guidance Card matching dynamic AQI */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2.5">
          <Heart size={14} className="text-rose-500 fill-rose-500" />
          <span>Health Guidance</span>
        </div>

        <div className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
          <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${theme.guidanceBg}`}>
            {aqiVal <= 100 ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
          </div>
          <div>
            <h5 className={`text-xs font-extrabold ${theme.guidanceText}`}>
              {theme.guidanceTitle}
            </h5>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-snug">
              {theme.guidanceDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
