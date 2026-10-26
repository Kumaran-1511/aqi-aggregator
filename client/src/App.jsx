import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCards from './components/StatCards';
import AQIMap from './components/AQIMap';
import LocationDetailsCard from './components/LocationDetailsCard';
import ThreeColumnRow from './components/ThreeColumnRow';
import AnalyticsView from './components/AnalyticsView';
import StationsView from './components/StationsView';
import CompareView from './components/CompareView';
import HistoryView from './components/HistoryView';
import HealthGuidanceView from './components/HealthGuidanceView';
import AboutView from './components/AboutView';
import SettingsView from './components/SettingsView';
import AlertModal from './components/AlertModal';
import CitizenReportModal from './components/CitizenReportModal';
import AdminDashboard from './components/AdminDashboard';
import VoiceChatWidget from './components/VoiceChatWidget';
import { Map as MapIcon, MapPin, Maximize2, ChevronDown, Layers, Building2, Globe, AlertTriangle } from 'lucide-react';

export default function App() {
  const { t } = useTranslation();

  // Primary State
  const [stations, setStations] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Active view navigation
  const [activeTab, setActiveTab] = useState('dashboard');

  // Hierarchy filter state: CPCB State -> City -> Station
  const [selectedState, setSelectedState] = useState('All India');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  // Default main map view: Full India ([22.5, 82.0], zoom 5)
  const [mapCenter, setMapCenter] = useState([22.5, 82.0]);
  const [zoom, setZoom] = useState(5);
  const [selectedStation, setSelectedStation] = useState(null);

  // Map Layer Toggles
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Modals
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Socket.io Real-Time
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveToast, setLiveToast] = useState(null);

  // Dynamic Indian states list derived from active telemetry data (Only Indian States!)
  const availableStates = useMemo(() => {
    const raw = stations
      .filter(s => s.country === 'IN' && s.state && s.state !== 'International' && s.state !== 'Unknown')
      .map(s => s.state.trim());
    return ['All India', ...Array.from(new Set(raw)).sort((a, b) => a.localeCompare(b))];
  }, [stations]);

  // Dynamic city list derived from stations scoped to selected state (Deduplicated with case-insensitivity)
  const availableCities = useMemo(() => {
    const subset = stations.filter(s => {
      const matchCountry = s.country === 'IN' && s.state !== 'International';
      const matchState = selectedState === 'All India' || (s.state && s.state.toLowerCase() === selectedState.toLowerCase());
      return matchCountry && matchState;
    });

    const cityMap = new Map();
    subset.forEach(s => {
      if (s.city) {
        const trimmed = s.city.trim();
        const key = trimmed.toLowerCase();
        if (!cityMap.has(key)) {
          cityMap.set(key, trimmed);
        }
      }
    });

    return ['All Cities', ...Array.from(cityMap.values()).sort((a, b) => a.localeCompare(b))];
  }, [stations, selectedState]);

  // Active high pollution alerts count (AQI >= 150)
  const alertCount = useMemo(() => {
    return stations.filter(s => (s.lastAqi || 0) >= 150).length;
  }, [stations]);

  // Fetch stations from backend (strictly Indian stations only)
  const fetchStations = useCallback(async () => {
    try {
      const res = await axios.get('/api/aqi/stations');
      if (res.data.success && res.data.data) {
        const indianOnly = res.data.data.filter(s =>
          s.country === 'IN' &&
          s.state !== 'International' &&
          s.state !== 'Unknown' &&
          !['London', 'New York', 'Tokyo', 'Paris'].includes(s.city)
        );

        setStations(indianOnly);

        if (!selectedStation) {
          const defaultSt = indianOnly.find(s => s.name.includes('Anand Vihar')) ||
            indianOnly.find(s => s.city === 'Bengaluru') ||
            indianOnly.find(s => s.city === 'Chennai') ||
            indianOnly[0];
          setSelectedStation(defaultSt);
        }
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  // Fetch citizen reports
  const fetchReports = useCallback(async () => {
    try {
      const res = await axios.get('/api/reports');
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.warn('Citizen reports fetch skipped:', err.message);
    }
  }, []);

  // Initialize Socket.io and fetch data
  useEffect(() => {
    fetchStations();
    fetchReports();

    const socketEndpoint = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
      : undefined;

    const socket = io(socketEndpoint, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Real-Time Push Event: aqi:update
    socket.on('aqi:update', (payload) => {
      if (payload?.stations) {
        const indianOnly = payload.stations.filter(s =>
          s.country === 'IN' &&
          s.state !== 'International' &&
          !['London', 'New York', 'Tokyo', 'Paris'].includes(s.city)
        );
        setStations(indianOnly);
      }
      setLastUpdated(new Date());
      setLiveToast({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        count: payload?.count || 0
      });
      setTimeout(() => setLiveToast(null), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchStations, fetchReports]);

  // Handle State Dropdown change
  const handleStateChange = (stateName) => {
    setSelectedState(stateName);
    setSelectedCity('All Cities');

    if (stateName === 'All India') {
      setMapCenter([22.5, 82.0]);
      setZoom(5);
      return;
    }

    const stateStations = stations.filter(s => s.state && s.state.toLowerCase() === stateName.toLowerCase());
    if (stateStations.length > 0) {
      let sumLat = 0, sumLng = 0, valid = 0;
      stateStations.forEach(st => {
        if (st.location?.coordinates && st.location.coordinates.length >= 2) {
          sumLng += st.location.coordinates[0];
          sumLat += st.location.coordinates[1];
          valid++;
        }
      });
      if (valid > 0) {
        setMapCenter([sumLat / valid, sumLng / valid]);
        setZoom(7);
      }
      setSelectedStation(stateStations[0]);
    }
  };

  // Handle City Dropdown change
  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);

    if (cityName === 'All Cities') {
      if (selectedState !== 'All India') {
        handleStateChange(selectedState);
      } else {
        setMapCenter([22.5, 82.0]);
        setZoom(5);
      }
      return;
    }

    const cityStations = stations.filter(s => s.city && s.city.toLowerCase() === cityName.toLowerCase());
    if (cityStations.length > 0) {
      const match = cityStations[0];
      if (match.location?.coordinates && match.location.coordinates.length >= 2) {
        setMapCenter([match.location.coordinates[1], match.location.coordinates[0]]);
        setZoom(11);
      }
      setSelectedStation(match);
      if (match.state && selectedState === 'All India') {
        setSelectedState(match.state);
      }
    }
  };

  // Handle selecting a station pin or card
  const handleStationSelect = (st) => {
    if (!st) return;
    setSelectedStation(st);
    if (st.location?.coordinates && st.location.coordinates.length >= 2) {
      setMapCenter([st.location.coordinates[1], st.location.coordinates[0]]);
      setZoom(12);
    }
    if (st.state) setSelectedState(st.state);
    if (st.city) setSelectedCity(st.city);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans">
      {/* 1. Left Dark Navy Sidebar (~230px) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Main Content Header Row */}
        <Header
          pageTitle="Real-Time AQI Aggregator & Mapping System"
          lastUpdated={lastUpdated}
          alertCount={alertCount}
          onOpenAlerts={() => setIsAlertOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />

        {/* Live WebSocket Toast Banner */}
        {liveToast && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 shadow-sm flex items-center justify-between text-xs font-semibold animate-slide-up">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
              <span>Live Push Broadcast: Refreshed {liveToast.count} stations across India at {liveToast.time}</span>
            </div>
            <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Socket.io Push</span>
          </div>
        )}

        {/* Prominent High Pollution Warning Banner on Dashboard */}
        {alertCount > 0 && (
          <div
            onClick={() => setIsAlertOpen(true)}
            className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm flex items-center justify-between text-xs font-semibold cursor-pointer hover:bg-rose-100/90 transition group"
            title="Click to open alert panel"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0"></span>
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-rose-600" />
                Air Quality Alert: {alertCount} monitoring stations in India currently report Unhealthy/Severe air quality (AQI ≥ 150)
              </span>
            </div>
            <span className="text-[11px] bg-rose-600 group-hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider shadow-sm transition">
              View Alerts
            </span>
          </div>
        )}

        {/* Dynamic Views by Navigation Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stat card row directly below header (5 dynamically themed cards) */}
            <StatCards
              stations={stations}
              currentState={selectedState}
              currentCity={selectedCity}
            />

            {/* Main Grid: Left Column (~65% width) = Map Card; Right Column (~35% width) = Stacked Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 px-6">
              {/* Left Column: Leaflet Map Card */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
                {/* Map Card Header Toolbar: Live Air Quality Map + CPCB State ▾ + City ▾ + Heatmap + Fullscreen */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <MapIcon size={16} className="text-slate-700" />
                    <span>Live Air Quality Map</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({stations.length} stations across Indian states)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* State Selector Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedState}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200/90 rounded-lg py-1 pl-7 pr-7 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px] truncate"
                        title="Filter by Indian State"
                      >
                        {availableStates.map(st => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <Building2 size={13} className="absolute left-2 top-2 text-slate-600 pointer-events-none" />
                      <ChevronDown size={13} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* City Selector Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedCity}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200/90 rounded-lg py-1 pl-7 pr-7 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px] truncate"
                        title="Filter by City"
                      >
                        {availableCities.map(c => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <MapPin size={13} className="absolute left-2 top-2 text-slate-600 pointer-events-none" />
                      <ChevronDown size={13} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Reset to Full India View */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedState('All India');
                        setSelectedCity('All Cities');
                        setMapCenter([22.5, 82.0]);
                        setZoom(5);
                      }}
                      title="Reset to Full India View"
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition"
                    >
                      <Globe size={14} />
                    </button>

                    {/* Heatmap Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      title="Toggle Heatmap"
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition ${showHeatmap
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <Layers size={14} />
                    </button>

                    {/* Fullscreen Expand Icon */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('map')}
                      title="Expand Fullscreen Map"
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Leaflet Map Canvas */}
                <div className="w-full h-[470px] rounded-xl overflow-hidden border border-slate-200 relative">
                  {loading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-xs text-slate-500 font-medium">Loading geospatial air quality map...</p>
                    </div>
                  ) : (
                    <AQIMap
                      stations={stations}
                      reports={reports}
                      showHeatmap={showHeatmap}
                      selectedStation={selectedStation}
                      mapCenter={mapCenter}
                      zoom={zoom}
                      onSelectStation={handleStationSelect}
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Stacked Cards (Location Details + Pollutant Levels + Health Guidance) */}
              <div className="lg:col-span-4">
                <LocationDetailsCard
                  station={selectedStation}
                  stations={stations}
                  onSelectStation={handleStationSelect}
                />
              </div>
            </div>

            {/* Below Map Row: Three-Column Row (AQI Trend, Compare Locations, Recent Readings) */}
            <ThreeColumnRow
              station={selectedStation}
              stations={stations}
              onViewAllHistory={() => setActiveTab('history')}
              onSelectStation={handleStationSelect}
            />
          </div>
        )}

        {/* Live Map Fullscreen Page */}
        {activeTab === 'map' && (
          <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
            <div className="bg-white p-3 rounded-xl border border-slate-200 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-800">Nationwide Navigation:</span>

                {/* State selector */}
                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 rounded-lg py-1 pl-7 pr-7 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableStates.map(st => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <Building2 size={13} className="absolute left-2 top-2 text-slate-600 pointer-events-none" />
                  <ChevronDown size={13} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                </div>

                {/* City selector */}
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 rounded-lg py-1 pl-7 pr-7 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableCities.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <MapPin size={13} className="absolute left-2 top-2 text-slate-600 pointer-events-none" />
                  <ChevronDown size={13} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                </div>

                {/* Reset Full India */}
                <button
                  onClick={() => {
                    setSelectedState('All India');
                    setSelectedCity('All Cities');
                    setMapCenter([22.5, 82.0]);
                    setZoom(5);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1"
                >
                  <Globe size={13} />
                  <span>Full India (Zoom 5)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${showHeatmap ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                >
                  <Layers size={13} />
                  <span>Heatmap {showHeatmap ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
              <AQIMap
                stations={stations}
                reports={reports}
                showHeatmap={showHeatmap}
                selectedStation={selectedStation}
                mapCenter={mapCenter}
                zoom={zoom}
                onSelectStation={handleStationSelect}
              />
            </div>
          </div>
        )}

        {/* Stations Page */}
        {activeTab === 'stations' && (
          <StationsView
            stations={stations}
            onSelectStation={(st) => {
              handleStationSelect(st);
              setActiveTab('dashboard');
            }}
          />
        )}

        {/* Analytics Page */}
        {activeTab === 'analytics' && (
          <AnalyticsView stations={stations} />
        )}

        {/* Compare Locations Page */}
        {activeTab === 'compare' && (
          <CompareView
            stations={stations}
            onSelectStation={(st) => {
              handleStationSelect(st);
              setActiveTab('dashboard');
            }}
          />
        )}

        {/* 24-Hour / 7-Day History Page */}
        {activeTab === 'history' && (
          <HistoryView
            station={selectedStation}
            stations={stations}
            onSelectStation={handleStationSelect}
          />
        )}

        {/* Health Guidance Page */}
        {activeTab === 'health' && (
          <HealthGuidanceView station={selectedStation} />
        )}

        {/* About / Data Sources Page */}
        {activeTab === 'about' && (
          <AboutView />
        )}

        {/* Settings Page */}
        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </div>

      {/* Global Modals & Overlay Drawers */}
      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        stations={stations}
        currentCenter={mapCenter}
        onSelectStation={handleStationSelect}
      />

      <CitizenReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onReportCreated={() => fetchReports()}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onIngestionTriggered={() => fetchStations()}
      />

      <VoiceChatWidget
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        selectedStation={selectedStation}
      />
    </div>
  );
}
