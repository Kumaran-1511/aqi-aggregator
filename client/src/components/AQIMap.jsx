import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { getAQIColor, getAQILevel } from '../utils/aqiColors';
import HeatmapLayer from './HeatmapLayer';

// Controller to smoothly pan map when center changes
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== undefined && center[1] !== undefined) {
      map.flyTo(center, zoom || 5, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Generate circular marker sized and colored by AQI band with number inside & label underneath
function createStationIcon(aqi, name, isSelected = false) {
  const color = getAQIColor(aqi);
  const size = 32;

  return L.divIcon({
    className: 'custom-aqi-icon',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          background-color: ${color}; 
          border-radius: 9999px;
          border: 2px solid #ffffff;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 11px;
          font-family: inherit;
          ${isSelected ? 'transform: scale(1.2); box-shadow: 0 0 0 3px #1E293B;' : ''}
        ">
          ${Math.round(aqi || 0)}
        </div>
        <div style="
          margin-top: 2px;
          font-size: 10px;
          font-weight: 700;
          color: #0F172A;
          text-shadow: -1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF;
          white-space: nowrap;
          pointer-events: none;
        ">
          ${name}
        </div>
      </div>
    `,
    iconSize: [60, 48],
    iconAnchor: [30, 16],
    popupAnchor: [0, -20]
  });
}

// Custom icon for marker clusters showing count & average AQI
const createClusterCustomIcon = function (cluster) {
  const count = cluster.getChildCount();
  const markers = cluster.getAllChildMarkers();

  let aqiSum = 0;
  let validCount = 0;
  markers.forEach(m => {
    const aqi = m.options['data-aqi'];
    if (typeof aqi === 'number' && !isNaN(aqi)) {
      aqiSum += aqi;
      validCount++;
    }
  });

  const avgAqi = validCount > 0 ? Math.round(aqiSum / validCount) : 50;
  const color = getAQIColor(avgAqi);

  return L.divIcon({
    html: `
      <div style="
        width: 44px;
        height: 44px;
        border-radius: 9999px;
        background-color: ${color};
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-family: inherit;
        line-height: 1.1;
        cursor: pointer;
      ">
        <span style="font-size: 13px; font-weight: 800;">${count}</span>
        <span style="font-size: 9px; font-weight: 700; opacity: 0.95;">${avgAqi} AQI</span>
      </div>
    `,
    className: 'custom-aqi-cluster-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

export default function AQIMap({
  stations = [],
  reports = [],
  showHeatmap = false,
  selectedStation = null,
  mapCenter = [22.5, 82.0], // Full-India default center
  zoom = 5,                 // Full-India default zoom
  onSelectStation
}) {
  // Heatmap points: [lat, lng, aqi]
  const heatPoints = useMemo(() => {
    return stations.map(s => {
      const coords = s.location?.coordinates || [82.0, 22.5];
      return {
        lat: coords[1],
        lng: coords[0],
        aqi: s.lastAqi || 50
      };
    });
  }, [stations]);

  const legendBands = [
    { label: 'Good (0-50)', color: '#22C55E' },
    { label: 'Moderate (51-100)', color: '#FACC15' },
    { label: 'Unhealthy (101-150)', color: '#F97316' },
    { label: 'Very Unhealthy (151-200)', color: '#EF4444' },
    { label: 'Hazardous (201+)', color: '#991B1B' }
  ];

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <ZoomControl position="topleft" />
        <MapController center={mapCenter} zoom={zoom} />

        {/* Free OpenStreetMap tile layer: zero keys required */}
        <TileLayer
          attribution='Leaflet | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Optional Heatmap Layer */}
        {showHeatmap && <HeatmapLayer points={heatPoints} />}

        {/* Marker Clustering Layer for 200+ Nationwide Indian Stations */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {stations.map((st) => {
            const coords = st.location?.coordinates;
            if (!coords || coords.length < 2) return null;
            const lat = coords[1];
            const lng = coords[0];
            const isSelected = selectedStation && (selectedStation.stationId === st.stationId || selectedStation._id === st._id);
            const icon = createStationIcon(st.lastAqi, st.name, isSelected);
            const level = getAQILevel(st.lastAqi);

            return (
              <Marker
                key={st.stationId || st._id}
                position={[lat, lng]}
                icon={icon}
                data-aqi={st.lastAqi}
                eventHandlers={{
                  click: () => onSelectStation && onSelectStation(st)
                }}
              >
                <Popup minWidth={240}>
                  <div className="p-2.5 text-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {st.city}{st.state ? `, ${st.state}` : ''} • {st.source || 'CPCB'}
                        </p>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: level.color }}
                      >
                        {st.lastAqi} AQI
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 mb-2">
                      Category: <strong style={{ color: level.color }}>{level.name}</strong>
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (onSelectStation) {
                          onSelectStation(st);
                        }
                      }}
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>✓ Select Location</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Floating Legend Bottom-Left */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-slate-200/90 shadow-md">
        <div className="space-y-1">
          {legendBands.map((band) => (
            <div key={band.label} className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: band.color }}
              />
              <span>{band.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
