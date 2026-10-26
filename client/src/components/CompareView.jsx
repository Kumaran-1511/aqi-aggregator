import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { getAQILevel, getAQIColor } from '../utils/aqiColors';
import { GitCompare, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function CompareView({ stations = [], onSelectStation }) {
  // Initial 3 selected stations
  const [selectedIds, setSelectedIds] = useState(
    stations.slice(0, 3).map(s => s.stationId)
  );

  useEffect(() => {
    if (selectedIds.length === 0 && stations.length > 0) {
      setSelectedIds(stations.slice(0, 3).map(s => s.stationId));
    }
  }, [stations, selectedIds.length]);

  const selectedStations = stations.filter(s => selectedIds.includes(s.stationId));

  const handleToggleStation = (stationId) => {
    if (selectedIds.includes(stationId)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter(id => id !== stationId));
      }
    } else {
      if (selectedIds.length < 5) {
        setSelectedIds([...selectedIds, stationId]);
      } else {
        alert('You can compare up to 5 locations simultaneously.');
      }
    }
  };

  const chartData = selectedStations.map(s => ({
    name: s.name.length > 15 ? s.name.slice(0, 14) + '..' : s.name,
    fullName: s.name,
    city: s.city,
    AQI: s.lastAqi || 0,
    'PM2.5': s.pollutants?.pm25 || 0,
    'PM10': s.pollutants?.pm10 || 0,
    'NO2': s.pollutants?.no2 || 0
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          Multi-Location Air Quality Comparison
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Side-by-side spatial comparison of AQI levels and individual pollutant parameters.
        </p>
      </div>

      {/* Station Selector Badges */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-xs font-bold text-slate-700 mb-2">Select stations to compare (up to 5):</p>
        <div className="flex flex-wrap gap-2">
          {stations.map(s => {
            const isSelected = selectedIds.includes(s.stationId);
            return (
              <button
                key={s.stationId}
                onClick={() => handleToggleStation(s.stationId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <span>{s.name} ({s.city})</span>
                {isSelected && <span className="text-blue-200">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-side Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {selectedStations.map(s => {
          const lvl = getAQILevel(s.lastAqi);
          return (
            <div
              key={s.stationId}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 font-heading">{s.name}</h3>
                    <p className="text-[11px] text-slate-500">{s.city}, {s.country}</p>
                  </div>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: lvl.color }}
                  >
                    {lvl.name}
                  </span>
                </div>

                <div className="my-4 flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white"
                    style={{ backgroundColor: lvl.color }}
                  >
                    <span className="text-2xl font-extrabold font-heading">{Math.round(s.lastAqi || 0)}</span>
                    <span className="text-[9px] uppercase font-bold">AQI</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{lvl.healthRisk}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Source: {s.source?.toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-center text-[10px] border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-medium">PM2.5</span>
                    <span className="font-bold text-slate-800">{s.pollutants?.pm25 ?? '--'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">PM10</span>
                    <span className="font-bold text-slate-800">{s.pollutants?.pm10 ?? '--'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">NO2</span>
                    <span className="font-bold text-slate-800">{s.pollutants?.no2 ?? '--'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectStation && onSelectStation(s)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Focus On Map</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
          Direct Metric Benchmark (AQI, PM2.5, PM10, NO₂)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '11px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="AQI" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="PM2.5" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="PM10" fill="#F97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="NO2" fill="#FACC15" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
