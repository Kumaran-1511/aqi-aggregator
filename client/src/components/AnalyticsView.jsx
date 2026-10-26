import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { getAQIColor, getAQILevel, AQI_LEVELS } from '../utils/aqiColors';
import { PieChart as PieIcon, Globe2, BarChart2, TrendingUp, AlertCircle } from 'lucide-react';

function createCityIcon(aqi, cityName) {
  const color = getAQIColor(aqi);
  return L.divIcon({
    className: 'custom-city-marker',
    html: `
      <div style="
        background-color: ${color}; 
        color: white; 
        padding: 4px 8px; 
        border-radius: 9999px; 
        font-weight: 700; 
        font-size: 11px; 
        border: 2px solid white; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">
        <span>${cityName}</span>
        <span style="background: rgba(0,0,0,0.25); padding: 1px 4px; border-radius: 6px;">${Math.round(aqi)}</span>
      </div>
    `,
    iconSize: [80, 26],
    iconAnchor: [40, 13]
  });
}

export default function AnalyticsView({ stations = [] }) {
  // Aggregate pollutant contribution shares across network
  const pollutantTotals = stations.reduce(
    (acc, s) => {
      const p = s.pollutants || {};
      acc.pm25 += p.pm25 || 0;
      acc.pm10 += p.pm10 || 0;
      acc.no2 += p.no2 || 0;
      acc.so2 += p.so2 || 0;
      acc.co += (p.co || 0) * 10; // scale for visualization
      acc.o3 += p.o3 || 0;
      return acc;
    },
    { pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0 }
  );

  const donutData = [
    { name: 'PM2.5', value: Math.round(pollutantTotals.pm25), color: '#EF4444' },
    { name: 'PM10', value: Math.round(pollutantTotals.pm10), color: '#F97316' },
    { name: 'NO2', value: Math.round(pollutantTotals.no2), color: '#FACC15' },
    { name: 'O3', value: Math.round(pollutantTotals.o3), color: '#84CC16' },
    { name: 'SO2', value: Math.round(pollutantTotals.so2), color: '#06B6D4' },
    { name: 'CO', value: Math.round(pollutantTotals.co), color: '#8B5CF6' }
  ];

  // Group stations by distinct major cities for the National multi-city overview
  const cityMap = {};
  stations.forEach(s => {
    if (!cityMap[s.city]) {
      cityMap[s.city] = {
        city: s.city,
        country: s.country,
        lat: s.location?.coordinates[1] || 28.6,
        lng: s.location?.coordinates[0] || 77.2,
        stations: [s],
        totalAqi: s.lastAqi || 0
      };
    } else {
      cityMap[s.city].stations.push(s);
      cityMap[s.city].totalAqi += (s.lastAqi || 0);
    }
  });

  const cityList = Object.values(cityMap).map(c => ({
    city: c.city,
    country: c.country,
    lat: c.lat,
    lng: c.lng,
    stationCount: c.stations.length,
    avgAqi: Math.round(c.totalAqi / c.stations.length)
  }));

  // Indian country view center
  const indiaCenter = [22.5937, 78.9629];

  return (
    <div className="p-6 space-y-6">
      {/* Title & Description */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          National Air Quality Analytics & Telemetry
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Macro pollution distribution and multi-city national overview across India and global benchmarks.
        </p>
      </div>

      {/* Grid: Donut Chart + Multi-City National Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pollutant Distribution Donut Chart */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieIcon size={16} className="text-blue-600" />
              <span>Pollutant Contribution Share</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Share of each chemical parameter driving regional air quality index
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} units`, `${name} Relative Impact`]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val) => <span className="text-[11px] text-slate-700 font-medium">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-red-50/70 border border-red-100">
              <span className="text-[10px] text-red-600 block font-semibold">Primary Driver</span>
              <span className="font-bold text-slate-800">PM2.5 (Fine)</span>
            </div>
            <div className="p-2 rounded-lg bg-orange-50/70 border border-orange-100">
              <span className="text-[10px] text-orange-600 block font-semibold">Secondary</span>
              <span className="font-bold text-slate-800">PM10 (Dust)</span>
            </div>
            <div className="p-2 rounded-lg bg-yellow-50/70 border border-yellow-100">
              <span className="text-[10px] text-yellow-700 block font-semibold">Gaseous</span>
              <span className="font-bold text-slate-800">NO₂ / CO</span>
            </div>
          </div>
        </div>

        {/* Right: National / Multi-City Map View */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Globe2 size={16} className="text-blue-600" />
                <span>National & Multi-City Map View</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Country-wide spatial comparison showing simultaneous colored city nodes
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              {cityList.length} Cities Tracked
            </span>
          </div>

          <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-200 relative">
            <MapContainer
              center={indiaCenter}
              zoom={4}
              zoomControl={false}
              scrollWheelZoom={false}
              className="w-full h-full"
            >
              <ZoomControl position="topleft" />
              {/* Free OpenStreetMap tile layer: zero keys required */}
              <TileLayer
                attribution='Leaflet | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              {cityList.map((c) => {
                const icon = createCityIcon(c.avgAqi, c.city);
                const lvl = getAQILevel(c.avgAqi);
                return (
                  <Marker key={c.city} position={[c.lat, c.lng]} icon={icon}>
                    <Popup>
                      <div className="p-2 text-slate-800 text-xs">
                        <h4 className="font-bold text-sm text-slate-900">{c.city}</h4>
                        <p className="text-slate-500 text-[11px] mb-1">{c.country} • {c.stationCount} Stations</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="px-2 py-0.5 rounded text-white font-bold"
                            style={{ backgroundColor: lvl.color }}
                          >
                            {c.avgAqi} AQI
                          </span>
                          <span className="font-semibold text-slate-700">{lvl.name}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* City Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={15} className="text-blue-600" />
            <span>Multi-City Average Air Quality Index</span>
          </h3>
          <span className="text-[11px] text-slate-400">Calculated under Indian CPCB standard</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">City</th>
                <th className="py-2.5 px-4">Country</th>
                <th className="py-2.5 px-4">Monitoring Stations</th>
                <th className="py-2.5 px-4">City Average AQI</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Health Advisory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cityList.map((c) => {
                const lvl = getAQILevel(c.avgAqi);
                return (
                  <tr key={c.city} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.city}</td>
                    <td className="py-3 px-4 text-slate-600">{c.country}</td>
                    <td className="py-3 px-4 text-slate-600">{c.stationCount} Active</td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-slate-900 font-heading text-sm mr-2">
                        {c.avgAqi}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm inline-block"
                        style={{ backgroundColor: lvl.color }}
                      >
                        {lvl.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                      {lvl.healthRisk}
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
