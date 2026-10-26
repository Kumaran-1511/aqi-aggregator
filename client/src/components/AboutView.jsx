import React from 'react';
import { Leaf, Database, Cpu, Globe, Heart, ShieldCheck, Check } from 'lucide-react';

export default function AboutView() {
  const sources = [
    {
      name: 'CPCB (Central Pollution Control Board)',
      role: 'Official Indian National Air Quality Index standards and data.gov.in real-time sensor API.',
      status: 'Integrated'
    },
    {
      name: 'Open-Meteo Air Quality API',
      role: 'Zero-setup baseline high-resolution spatial atmospheric telemetry and meteorological fallback.',
      status: 'Active (Zero-Key)'
    },
    {
      name: 'OpenAQ v3',
      role: 'Global open air quality physical monitoring station network integration.',
      status: 'Integrated'
    },
    {
      name: 'WAQI / AQICN',
      role: 'World Air Quality Index project feed spanning international embassy posts.',
      status: 'Integrated'
    },
    {
      name: 'IQAir AirVisual',
      role: 'Micro-climate hyper-local nearest city pollutant indices.',
      status: 'Integrated'
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Leaf className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Real-Time AQI Aggregator & Mapping System
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          App Name: <strong>AQI Map</strong> • Tagline: <em>"Breathe Better, Live Better"</em>
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <Cpu className="text-blue-600 mb-2" size={20} />
          <h3 className="font-bold text-sm text-slate-800">MERN Architecture</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Node.js & Express REST microservices, MongoDB with 2dsphere spatial indexing, and Vite + React 18 reactive UI.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <Globe className="text-emerald-600 mb-2" size={20} />
          <h3 className="font-bold text-sm text-slate-800">Zero-Key Leaflet Maps</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Direct integration with OpenStreetMap tile servers with zero vendor API keys or licensing watermarks required.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <ShieldCheck className="text-purple-600 mb-2" size={20} />
          <h3 className="font-bold text-sm text-slate-800">CPCB NAQI Standard</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Strict sub-index calculation conforming to Indian Central Pollution Control Board formulas for 6 key pollutants.
          </p>
        </div>
      </div>

      {/* Integrated Data Feeds List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Database size={15} className="text-blue-600" />
          <span>Integrated Environmental Telemetry Feeds</span>
        </h3>
        <div className="divide-y divide-slate-100">
          {sources.map((s) => (
            <div key={s.name} className="py-2.5 flex items-start justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">{s.name}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.role}</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] shrink-0 border border-emerald-200">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CPCB Scale Reference Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          CPCB National AQI Scale Reference Breakpoint Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">AQI Range</th>
                <th className="py-2 px-3">Color Swatch</th>
                <th className="py-2 px-3">PM2.5 (24h)</th>
                <th className="py-2 px-3">PM10 (24h)</th>
                <th className="py-2 px-3">NO₂ (24h)</th>
                <th className="py-2 px-3">CO (8h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              <tr>
                <td className="py-2 px-3 font-bold text-green-700">Good</td>
                <td className="py-2 px-3">0–50</td>
                <td className="py-2 px-3"><span className="inline-block w-4 h-4 rounded bg-[#22C55E]"></span></td>
                <td className="py-2 px-3">0–30</td>
                <td className="py-2 px-3">0–50</td>
                <td className="py-2 px-3">0–40</td>
                <td className="py-2 px-3">0–1.0</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-lime-700">Satisfactory</td>
                <td className="py-2 px-3">51–100</td>
                <td className="py-2 px-3"><span className="inline-block w-4 h-4 rounded bg-[#84CC16]"></span></td>
                <td className="py-2 px-3">31–60</td>
                <td className="py-2 px-3">51–100</td>
                <td className="py-2 px-3">41–80</td>
                <td className="py-2 px-3">1.1–2.0</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-yellow-700">Moderate</td>
                <td className="py-2 px-3">101–200</td>
                <td className="py-2 px-3"><span className="inline-block w-4 h-4 rounded bg-[#FACC15]"></span></td>
                <td className="py-2 px-3">61–90</td>
                <td className="py-2 px-3">101–250</td>
                <td className="py-2 px-3">81–180</td>
                <td className="py-2 px-3">2.1–10.0</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-orange-700">Poor</td>
                <td className="py-2 px-3">201–300</td>
                <td className="py-2 px-3"><span className="inline-block w-4 h-4 rounded bg-[#F97316]"></span></td>
                <td className="py-2 px-3">91–120</td>
                <td className="py-2 px-3">251–350</td>
                <td className="py-2 px-3">181–280</td>
                <td className="py-2 px-3">10.1–17.0</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-red-700">Very Poor</td>
                <td className="py-2 px-3">301–400</td>
                <td className="py-2 px-3"><span className="inline-block w-4 h-4 rounded bg-[#EF4444]"></span></td>
                <td className="py-2 px-3">121–250</td>
                <td className="py-2 px-3">351–430</td>
                <td className="py-2 px-3">281–400</td>
                <td className="py-2 px-3">17.1–34.0</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-red-900">Severe</td>
                <td className="py-2 px-3">401–500</td>
                <td className="py-2 px-3"><span className="inline-block w-4 h-4 rounded bg-[#991B1B]"></span></td>
                <td className="py-2 px-3">250+</td>
                <td className="py-2 px-3">430+</td>
                <td className="py-2 px-3">400+</td>
                <td className="py-2 px-3">34.0+</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Footer Banner */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-600 space-y-1">
        <p className="font-bold text-slate-800">
          Real-Time AQI Aggregator & Mapping System | [Your College Name]
        </p>
        <p className="text-[11px] text-slate-500">
          Built with ♥ using the MERN Stack • Data from: CPCB | OpenAQ | IQAir | WAQI | Open-Meteo
        </p>
      </div>
    </div>
  );
}
