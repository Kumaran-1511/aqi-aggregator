import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAQILevel } from '../utils/aqiColors';
import { History, Download, FileText, Calendar, Filter } from 'lucide-react';

export default function HistoryView({ stations = [], selectedStation = null }) {
  const [selectedState, setSelectedState] = useState(selectedStation?.state || 'All India');
  const [selectedCity, setSelectedCity] = useState(selectedStation?.city || 'All Cities');
  const [stationId, setStationId] = useState(
    selectedStation?.stationId || stations[0]?.stationId || 'cpcb-delhi-delhi-anand-vihar'
  );
  const [range, setRange] = useState('24h');
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Distinct states
  const availableStates = React.useMemo(() => {
    const raw = stations.map(s => s.state).filter(st => st && st !== 'International' && st !== 'Unknown');
    return ['All India', ...Array.from(new Set(raw)).sort((a, b) => a.localeCompare(b))];
  }, [stations]);

  // Distinct cities scoped to state
  const availableCities = React.useMemo(() => {
    const pool = selectedState === 'All India'
      ? stations
      : stations.filter(s => s.state && s.state.toLowerCase() === selectedState.toLowerCase());
    const raw = pool.map(s => s.city).filter(Boolean);
    return ['All Cities', ...Array.from(new Set(raw)).sort((a, b) => a.localeCompare(b))];
  }, [stations, selectedState]);

  // Filtered & deduplicated stations
  const filteredStations = React.useMemo(() => {
    const pool = stations.filter(s => {
      const matchState = selectedState === 'All India' || (s.state && s.state.toLowerCase() === selectedState.toLowerCase());
      const matchCity = selectedCity === 'All Cities' || (s.city && s.city.toLowerCase() === selectedCity.toLowerCase());
      return matchState && matchCity;
    });

    // Deduplicate by clean name + city
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
  }, [stations, selectedState, selectedCity]);

  // Ensure valid stationId when state/city filter changes
  useEffect(() => {
    if (filteredStations.length > 0) {
      const exists = filteredStations.some(s => s.stationId === stationId);
      if (!exists) {
        setStationId(filteredStations[0].stationId);
      }
    }
  }, [filteredStations]);

  useEffect(() => {
    if (!stationId) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/aqi/history/${stationId}?range=${range}`);
        if (res.data.success) {
          setReadings(res.data.data.reverse()); // most recent first
        }
      } catch (err) {
        console.warn('History fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [stationId, range]);

  const currentStation = stations.find(s => s.stationId === stationId) || filteredStations[0] || stations[0];

  const handleExportCSV = () => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const url = `${apiBase}/api/export/${stationId}?format=csv&range=${range}`;
    window.open(url, '_blank');
  };

  const handleExportPDF = () => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const url = `${apiBase}/api/export/${stationId}?format=pdf&range=${range}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Historical AQI Logs & Export Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Archived telemetry time-series records for auditing, analysis, and official reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download size={14} />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <FileText size={14} />
            <span>Export Official PDF</span>
          </button>
        </div>
      </div>

      {/* Controls: State, City, Station, and Range */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* State filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700 shrink-0">State:</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCity('All Cities');
              }}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* City / District filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700 shrink-0">District/City:</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 max-w-[150px] truncate"
            >
              {availableCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Station selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700 shrink-0">Station:</label>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 w-full sm:w-64 max-w-[260px] truncate"
            >
              {filteredStations.map(s => (
                <option key={s.stationId} value={s.stationId}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Time Range:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            {['24h', '7d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-md uppercase transition ${
                  range === r
                    ? 'bg-white text-blue-600 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {currentStation?.name} — {readings.length} Chronological Records
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Interval: 3-hour telemetry snapshots</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Querying time-series database...
          </div>
        ) : readings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No readings found for this station and range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">CPCB AQI</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Dominant</th>
                  <th className="py-2.5 px-4">PM2.5 (µg/m³)</th>
                  <th className="py-2.5 px-4">PM10 (µg/m³)</th>
                  <th className="py-2.5 px-4">NO₂ (µg/m³)</th>
                  <th className="py-2.5 px-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((r, i) => {
                  const lvl = getAQILevel(r.aqi);
                  return (
                    <tr key={r._id || i} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-medium text-slate-700">
                        {new Date(r.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-extrabold text-slate-900 font-heading">
                        {r.aqi}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm inline-block"
                          style={{ backgroundColor: lvl.color }}
                        >
                          {lvl.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 uppercase font-bold text-slate-600 text-[11px]">
                        {r.dominantPollutant || 'pm25'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{r.pollutants?.pm25 ?? '--'}</td>
                      <td className="py-2.5 px-4 text-slate-700">{r.pollutants?.pm10 ?? '--'}</td>
                      <td className="py-2.5 px-4 text-slate-700">{r.pollutants?.no2 ?? '--'}</td>
                      <td className="py-2.5 px-4 text-slate-500 capitalize">{r.source || 'cpcb'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
