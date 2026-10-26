import React, { useState, useMemo } from 'react';
import { getAQILevel } from '../utils/aqiColors';
import { Search, Download, ExternalLink, Filter, MapPin, Building2 } from 'lucide-react';

export default function StationsView({ stations = [], onSelectStation }) {
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');

  // Distinct states from station data
  const states = useMemo(() => {
    const raw = stations.map(s => s.state).filter(Boolean);
    return ['all', ...Array.from(new Set(raw)).sort()];
  }, [stations]);

  // Distinct cities scoped to the selected state
  const cities = useMemo(() => {
    const subset = selectedState === 'all'
      ? stations
      : stations.filter(s => s.state && s.state.toLowerCase() === selectedState.toLowerCase());
    const raw = subset.map(s => s.city).filter(Boolean);
    return ['all', ...Array.from(new Set(raw)).sort()];
  }, [stations, selectedState]);

  const handleStateChange = (stateName) => {
    setSelectedState(stateName);
    setSelectedCity('all');
  };

  const filtered = stations.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase())) ||
      (s.state && s.state.toLowerCase().includes(search.toLowerCase()));

    const matchState = selectedState === 'all' || (s.state && s.state.toLowerCase() === selectedState.toLowerCase());
    const matchCity = selectedCity === 'all' || (s.city && s.city.toLowerCase() === selectedCity.toLowerCase());

    return matchSearch && matchState && matchCity;
  });

  const handleExportCSV = () => {
    const headers = ['Station ID', 'Station Name', 'City', 'State', 'Country', 'AQI', 'Category', 'Dominant Pollutant', 'PM2.5', 'PM10', 'Source'];
    const rows = filtered.map(s => [
      s.stationId,
      `"${s.name}"`,
      `"${s.city || ''}"`,
      `"${s.state || ''}"`,
      s.country || 'IN',
      s.lastAqi,
      s.lastCategory,
      s.dominantPollutant || 'pm25',
      s.pollutants?.pm25 || '',
      s.pollutants?.pm10 || '',
      s.source
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stations_aqi_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Air Quality Monitoring Stations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete nationwide registry of {stations.length} active sensor telemetry stations spanning Indian states & CPCB monitoring networks.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Download size={14} />
          <span>Export Stations (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by station name, city or state..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* State Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Building2 size={15} className="text-slate-400 shrink-0" />
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full md:w-44 py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            {states.map(s => (
              <option key={s} value={s}>
                {s === 'all' ? 'All States' : s}
              </option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <MapPin size={15} className="text-slate-400 shrink-0" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full md:w-40 py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            {cities.map(c => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Cities' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Station Name</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">CPCB AQI</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">PM2.5</th>
                <th className="py-3 px-4">PM10</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((st) => {
                const lvl = getAQILevel(st.lastAqi);
                return (
                  <tr key={st.stationId || st._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{st.name}</div>
                      <div className="text-[10px] text-slate-400">{st.stationId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {st.city}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {st.state || 'India'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 font-heading text-sm">
                        {Math.round(st.lastAqi || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm inline-block"
                        style={{ backgroundColor: lvl.color }}
                      >
                        {lvl.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {st.pollutants?.pm25 ?? '--'} <span className="text-[10px] text-slate-400">µg/m³</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {st.pollutants?.pm10 ?? '--'} <span className="text-[10px] text-slate-400">µg/m³</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                        {st.source || 'cpcb'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectStation && onSelectStation(st)}
                        className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold transition flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
