import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // Convert points to [lat, lng, normalizedIntensity]
    // Normalized intensity: AQI / 400 (clamped between 0.15 and 1.0)
    const heatData = points.map(p => [
      p.lat,
      p.lng,
      Math.max(0.15, Math.min(1.0, (p.aqi || 50) / 350))
    ]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 55,
      blur: 35,
      maxZoom: 14,
      max: 1.0,
      minOpacity: 0.35,
      gradient: {
        0.2: '#10b981', // Good green
        0.4: '#f59e0b', // Moderate yellow
        0.6: '#f97316', // Orange
        0.8: '#ef4444', // Red
        0.9: '#8b5cf6', // Purple
        1.0: '#881337'  // Hazardous maroon
      }
    });

    heatLayer.addTo(map);

    return () => {
      if (map && heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
}
