import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'AeroWatch',
      tagline: 'Real-Time Air Quality & Geospatial Observatory',
      liveStatus: 'LIVE RADAR',
      refresh: 'Refresh Data',
      searchPlaceholder: 'Search city (e.g. Delhi, London, New York)...',
      nearMe: 'Find My Air',
      layers: {
        stations: 'Monitoring Stations',
        heatmap: 'Pollution Heatmap',
        citizenReports: 'Citizen Smoke Reports'
      },
      categories: {
        good: 'Good',
        moderate: 'Moderate',
        sensitive: 'Unhealthy for Sensitive Groups',
        unhealthy: 'Unhealthy',
        veryUnhealthy: 'Very Unhealthy',
        hazardous: 'Hazardous'
      },
      healthAdvice: {
        good: 'Air quality is satisfactory and poses little or no risk.',
        moderate: 'Air quality is acceptable. Sensitive individuals may experience minor cough.',
        sensitive: 'Children and adults with respiratory diseases should limit prolonged outdoor exertion.',
        unhealthy: 'Everyone may begin to experience health effects; wear an N95 mask outside.',
        veryUnhealthy: 'Health alert: Active children and adults, and people with respiratory disease, should avoid outdoor exertion.',
        hazardous: 'Emergency health warning: Everyone should stay indoors with air purifiers active.'
      },
      pollutants: {
        pm25: 'Fine Particles (PM2.5)',
        pm10: 'Coarse Dust (PM10)',
        no2: 'Nitrogen Dioxide (NO2)',
        so2: 'Sulfur Dioxide (SO2)',
        co: 'Carbon Monoxide (CO)',
        o3: 'Ozone (O3)'
      },
      drawer: {
        stationDetails: 'Station Analytics',
        currentAqi: 'Current AQI',
        primaryPollutant: 'Dominant Pollutant',
        lastUpdated: 'Last Updated',
        historicalTrends: 'Historical Trends & Variations',
        forecastNext24h: 'Next-Day AI Predictive Forecast',
        exportReport: 'Export Station Audit Data',
        exportPdf: 'Download PDF Certificate',
        exportCsv: 'Download CSV Data',
        close: 'Close Panel'
      },
      alerts: {
        title: 'Set Location Air Quality Alert',
        subtitle: 'Receive real-time email warnings whenever pollution breaches your safety threshold.',
        emailPlaceholder: 'Enter your email address',
        thresholdLabel: 'AQI Alert Threshold',
        subscribeButton: 'Subscribe to Alert',
        subscribedSuccess: 'Alert successfully created! You will be notified on threshold breach.'
      },
      citizenReport: {
        title: 'Report Smoke or Odor',
        subtitle: 'Crowdsourced community observation tied to your location.',
        category: 'Pollution Type',
        smoke: 'Smoke / Smog',
        garbage: 'Garbage Burning',
        industrial: 'Chemical / Industrial Odor',
        dust: 'Construction Dust',
        vehicle: 'Heavy Vehicle Exhaust',
        description: 'Details / Landmark',
        submit: 'Publish Geotagged Report',
        success: 'Report published and pinned to live map.'
      },
      chat: {
        title: 'AeroAI Voice Assistant',
        hint: 'Ask questions by voice or typing, e.g. "What is the AQI near me?", "How is Delhi air?"',
        placeholder: 'Ask AeroAI or tap mic...',
        send: 'Send',
        listening: 'Listening to your voice...',
        clear: 'Clear Chat'
      },
      admin: {
        title: 'Platform Administration',
        overview: 'System Overview',
        stations: 'Stations Management',
        logs: 'Ingestion Diagnostics',
        reports: 'Citizen Report Moderation',
        triggerIngestion: 'Trigger Ingestion Now',
        status: 'Status',
        actions: 'Actions'
      }
    }
  },
  ta: {
    translation: {
      appName: 'ஏரோ-வாட்ச் (AeroWatch)',
      tagline: 'நிகழ்நேர காற்று தரம் மற்றும் புவிசார் கண்காணிப்பு மையம்',
      liveStatus: 'நேரடி ரேடார்',
      refresh: 'தரவை புதுப்பிக்கவும்',
      searchPlaceholder: 'நகரத்தைத் தேடுங்கள் (எ.கா. சென்னை, கோவை, மதுரை)...',
      nearMe: 'என் பகுதியின் காற்று தரம்',
      layers: {
        stations: 'கண்காணிப்பு நிலையங்கள்',
        heatmap: 'மாசு அடர்த்தி வெப்ப வரைபடம்',
        citizenReports: 'பொதுமக்கள் மாசு புகார்கள்'
      },
      categories: {
        good: 'நல்லது (Good)',
        moderate: 'திருப்திகரமானது (Satisfactory)',
        sensitive: 'மிதமானது (Moderate)',
        unhealthy: 'மோசம் (Poor)',
        veryUnhealthy: 'மிக மோசம் (Very Poor)',
        hazardous: 'தீவிரமானது (Severe)'
      },
      healthAdvice: {
        good: 'காற்றின் தரம் மிக நன்று. பொதுமக்களுக்கு எந்த சுகாதார ஆபத்தும் இல்லை.',
        moderate: 'காற்றின் தரம் திருப்திகரமாக உள்ளது. சுவாசம் சார்ந்த உணர்திறன் உடையவர்கள் கவனமாக இருக்கவும்.',
        sensitive: 'சுவாசக் கோளாறு அல்லது இதய நோய் உள்ளவர்கள் கடுமையான வெளிப்புற உடற்பயிற்சிகளைத் தவிர்க்கவும்.',
        unhealthy: 'காற்றின் தரம் மோசம். பொதுமக்களுக்கு சுவாச சிரமங்கள் ஏற்படலாம்; வெளியில் செல்லும்போது N95 முகக்கவசம் அணியவும்.',
        veryUnhealthy: 'சுகாதார எச்சரிக்கை: அனைவரும் தீவிர வெளிப்புற நடவடிக்கைகளைத் தவிர்க்கவும். கதவு ஜன்னல்களை மூடி வைக்கவும்.',
        hazardous: 'அவசரகால எச்சரிக்கை: அனைவரும் வீட்டிற்குள்ளேயே இருக்க வேண்டும்; ஏர் பியூரிஃபையர் பயன்படுத்தவும்.'
      },
      pollutants: {
        pm25: 'நுண் துகள்கள் (PM2.5)',
        pm10: 'தூசி துகள்கள் (PM10)',
        no2: 'நைட்ரஜன் டை ஆக்சைடு (NO2)',
        so2: 'சல்பர் டை ஆக்சைடு (SO2)',
        co: 'கார்பன் மோனாக்சைடு (CO)',
        o3: 'ஓசோன் (O3)'
      },
      drawer: {
        stationDetails: 'நிலைய பகுப்பாய்வு',
        currentAqi: 'தற்போதைய AQI',
        primaryPollutant: 'முதன்மை மாசுபடுத்தி',
        lastUpdated: 'கடைசியாக புதுப்பிக்கப்பட்டது',
        historicalTrends: 'வரலாற்றுப் போக்குகள் மற்றும் மாறுபாடுகள்',
        forecastNext24h: 'அடுத்த நாள் AI முன்னறிவிப்பு',
        exportReport: 'நிலைய தரவு ஏற்றுமதி',
        exportPdf: 'PDF அறிக்கை பதிவிறக்கம்',
        exportCsv: 'CSV தரவு பதிவிறக்கம்',
        close: 'பலகையை மூடு'
      },
      alerts: {
        title: 'காற்று தர விழிப்புணர்வு எச்சரிக்கை பெறுக',
        subtitle: 'உங்கள் பகுதியில் காற்று மாசுபாடு உங்கள் வரம்பை மீறும்போது உடனடி மின்னஞ்சல் எச்சரிக்கையைப் பெறுங்கள்.',
        emailPlaceholder: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
        thresholdLabel: 'AQI எச்சரிக்கை வரம்பு',
        subscribeButton: 'எச்சரிக்கைக்கு பதிவு செய்க',
        subscribedSuccess: 'எச்சரிக்கை பதிவு வெற்றிகரமாக முடிந்தது! வரம்பு மீறினால் மின்னஞ்சல் அனுப்பப்படும்.'
      },
      citizenReport: {
        title: 'புகை அல்லது துர்நாற்றம் பற்றி புகார் செய்க',
        subtitle: 'உங்கள் இருப்பிடத்துடன் கூடிய பொதுமக்கள் காற்று மாசு அவதானிப்பு.',
        category: 'மாசு வகை',
        smoke: 'புகை / பனிப்புகை',
        garbage: 'குப்பை எரிப்பு',
        industrial: 'இரசாயன / தொழிற்சாலை துர்நாற்றம்',
        dust: 'கட்டுமான தூசி',
        vehicle: 'வாகன புகை',
        description: 'விவரங்கள் / அடையாள இடம்',
        submit: 'வரைபடத்தில் புகாரைப் பதிவு செய்க',
        success: 'புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டு நேரடி வரைபடத்தில் இணைக்கப்பட்டது.'
      },
      chat: {
        title: 'ஏரோ-AI குரல் உதவியாளர்',
        hint: 'குரல் அல்லது தட்டச்சு மூலம் கேளுங்கள், எ.கா: "என் அருகில் AQI என்ன?", "சென்னையில் காற்று எப்படி உள்ளது?"',
        placeholder: 'ஏரோ-AI இடம் கேளுங்கள் அல்லது மைக்கை அழுத்தவும்...',
        send: 'அனுப்பு',
        listening: 'உங்கள் குரலைக் கேட்கிறது...',
        clear: 'உரையாடலை அழி'
      },
      admin: {
        title: 'தள நிர்வாகம் (Platform Administration)',
        overview: 'கணினி கண்ணோட்டம்',
        stations: 'நிலையங்கள் மேலாண்மை',
        logs: 'தரவு உட்செலுத்தல் பதிவுகள்',
        reports: 'பொதுமக்கள் புகார்கள் மேலாண்மை',
        triggerIngestion: 'உடனே தரவை புதுப்பி',
        status: 'நிலை',
        actions: 'நடவடிக்கைகள்'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
