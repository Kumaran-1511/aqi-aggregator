// CPCB National AQI scale standard
export const AQI_LEVELS = [
  {
    min: 0,
    max: 50,
    name: 'Good',
    color: '#22C55E',
    bgColor: '#DCFCE7', // pastel green
    textColor: '#15803D',
    borderColor: '#86EFAC',
    tamil: 'நல்லது',
    healthRisk: 'Minimal impact on health. Ideal for outdoor recreation.',
    advice: 'Enjoy outdoor activities and open windows for fresh air.'
  },
  {
    min: 51,
    max: 100,
    name: 'Satisfactory',
    color: '#84CC16',
    bgColor: '#ECFCCB', // pastel lime
    textColor: '#4D7C0F',
    borderColor: '#BEF264',
    tamil: 'திருப்திகரமானது',
    healthRisk: 'Minor breathing discomfort to sensitive people.',
    advice: 'Sensitive individuals should consider reducing intense outdoor exertion.'
  },
  {
    min: 101,
    max: 200,
    name: 'Moderate',
    color: '#FACC15',
    bgColor: '#FEF9C3', // pastel yellow
    textColor: '#A16207',
    borderColor: '#FDE047',
    tamil: 'மிதமானது',
    healthRisk: 'Breathing discomfort to people with lung, asthma and heart diseases.',
    advice: 'People with respiratory or cardiac conditions should wear masks outdoors.'
  },
  {
    min: 201,
    max: 300,
    name: 'Poor',
    color: '#F97316',
    bgColor: '#FFEDD5', // pastel orange
    textColor: '#C2410C',
    borderColor: '#FDBA74',
    tamil: 'மோசம்',
    healthRisk: 'Breathing discomfort to most people on prolonged exposure.',
    advice: 'Avoid strenuous outdoor activities; wear an N95 mask when commuting.'
  },
  {
    min: 301,
    max: 400,
    name: 'Very Poor',
    color: '#EF4444',
    bgColor: '#FEE2E2', // pastel red
    textColor: '#B91C1C',
    borderColor: '#FCA5A5',
    tamil: 'மிக மோசம்',
    healthRisk: 'Respiratory illness on prolonged exposure. Avoid outdoor activities.',
    advice: 'Stay indoors, keep windows closed, and run an air purifier if available.'
  },
  {
    min: 401,
    max: 5000,
    name: 'Severe',
    color: '#991B1B',
    bgColor: '#FFE4E6', // pastel maroon
    textColor: '#881337',
    borderColor: '#FDA4AF',
    tamil: 'தீவிரமானது',
    healthRisk: 'Affects healthy people and seriously impacts those with existing diseases.',
    advice: 'Health emergency. Strictly remain indoors and minimize physical exertion.'
  }
];

export function getAQIColor(aqi) {
  const val = Math.max(0, Math.round(aqi || 0));
  for (const level of AQI_LEVELS) {
    if (val >= level.min && val <= level.max) {
      return level.color;
    }
  }
  return '#991B1B';
}

export function getAQILevel(aqi) {
  const val = Math.max(0, Math.round(aqi || 0));
  for (const level of AQI_LEVELS) {
    if (val >= level.min && val <= level.max) {
      return level;
    }
  }
  return AQI_LEVELS[AQI_LEVELS.length - 1];
}
