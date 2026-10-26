import React from 'react';
import { AQI_LEVELS } from '../utils/aqiColors';
import { HeartPulse, ShieldAlert, CheckCircle2, XCircle, Users, Activity, Baby, AlertCircle } from 'lucide-react';

export default function HealthGuidanceView() {
  const detailedGuidance = [
    {
      name: 'Good',
      range: '0–50',
      color: '#22C55E',
      general: 'Air quality is considered satisfactory. Enjoy normal outdoor activities.',
      vulnerable: 'No restrictions. Ideal for outdoor recreation for all age groups.',
      actions: ['Open windows for fresh ventilation', 'Ideal time for marathon training & cycling', 'No mask required']
    },
    {
      name: 'Satisfactory',
      range: '51–100',
      color: '#84CC16',
      general: 'Air quality is acceptable. Minor discomfort possible for unusually sensitive people.',
      vulnerable: 'Individuals with severe asthma should monitor for mild wheezing.',
      actions: ['Normal outdoor routines safe for 99% of people', 'Keep inhalers handy if asthmatic', 'Routine ventilation okay']
    },
    {
      name: 'Moderate',
      range: '101–200',
      color: '#FACC15',
      general: 'Breathing discomfort to people with lung disease, asthma, and heart conditions.',
      vulnerable: 'Children, seniors, and heart/lung patients should reduce prolonged outdoor exertion.',
      actions: ['Sensitive groups should wear basic masks outdoors', 'Close windows during rush hour', 'Consider air purifier in bedrooms']
    },
    {
      name: 'Poor',
      range: '201–300',
      color: '#F97316',
      general: 'Breathing discomfort to most people on prolonged exposure. Significant risk for sensitive groups.',
      vulnerable: 'Children and the elderly should avoid vigorous outdoor play; stay indoors where possible.',
      actions: ['Wear N95/N99 respirators when outdoors', 'Avoid heavy jogging near traffic', 'Run HEPA air purifiers']
    },
    {
      name: 'Very Poor',
      range: '301–400',
      color: '#EF4444',
      general: 'Respiratory illness on prolonged exposure. Pronounced effect on people with lung/heart diseases.',
      vulnerable: 'Everyone should avoid outdoor activities. High alert for vulnerable demographics.',
      actions: ['Do NOT exercise outdoors', 'Seal windows and doors tightly', 'Wear tight-fitting N95 mask if commute unavoidable']
    },
    {
      name: 'Severe',
      range: '401–500',
      color: '#991B1B',
      general: 'Emergency health conditions. Healthy people suffer respiratory irritation; severe impact on patients.',
      vulnerable: 'Strictly prohibit children and seniors from leaving home.',
      actions: ['Stay indoors with HEPA air filtration', 'Seek immediate medical attention if experiencing chest tightness', 'Avoid any vehicle or fuel emissions nearby']
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          CPCB National Air Quality Health Advisories
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Clinically reviewed guidance for each Indian National AQI category tailored for the general public and sensitive populations.
        </p>
      </div>

      {/* 6 Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {detailedGuidance.map((item) => (
          <div
            key={item.name}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                </div>
                <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  AQI {item.range}
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-800 block text-[11px] mb-0.5">General Population:</span>
                  <p className="leading-relaxed">{item.general}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-[11px] mb-0.5">Children, Elderly & Patients:</span>
                  <p className="leading-relaxed">{item.vulnerable}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">
                Recommended Actions:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-700">
                {item.actions.map((act, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-blue-600 shrink-0" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
