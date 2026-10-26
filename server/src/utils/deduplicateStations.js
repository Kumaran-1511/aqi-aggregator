const Station = require('../models/Station');
const Reading = require('../models/Reading');
const Alert = require('../models/Alert');
const Report = require('../models/Report');

/**
 * Standardize and clean station names by stripping trailing agency acronyms,
 * repeated city/state names, and extraneous punctuation.
 */
function cleanStationName(rawName, city) {
  if (!rawName) return city || 'Station';
  let name = String(rawName).trim();

  // Strip agency tags e.g. " - DPCC", " - CPCB", "_TSIIC IALA", " - WBPCB"
  name = name.replace(/\s*[-–—,_]\s*(?:CPCB|TNPCB|DPCC|MPCB|WBPCB|KSPCB|CECB|APPCB|HSPCB|TSPCB|UPPCB|RSPCB|PPCB|GPCB|BSPCB|OSPCB|MPPCB|CPCC|IITM|TSIIC\s*IALA|IMD|NEERI)\b.*$/i, '');

  // Strip repeated city suffix/prefix
  if (city) {
    const esc = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    name = name.replace(new RegExp(`\\s*[,\\-–—]\\s*${esc}\\b`, 'gi'), '');
    name = name.replace(new RegExp(`^${esc}\\s*[,\\-–—]\\s*`, 'gi'), '');
  }

  // Strip country / region suffixes
  name = name.replace(/\s*,\s*India$/i, '');
  name = name.replace(/\s*,\s*Delhi\s*,\s*Delhi$/i, '');
  name = name.replace(/\s*,\s*Delhi$/i, '');

  // Clean trailing hyphens or commas
  name = name.replace(/[-–—,]\s*$/, '').trim();

  return name || rawName;
}

/**
 * Great-circle distance between two [lng, lat] coordinate pairs in kilometers.
 */
function getDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) return 99999;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Determine if two station objects represent the same physical monitoring location.
 */
function areStationsDuplicate(s1, s2) {
  if (s1.stationId === s2.stationId) return true;

  const n1 = cleanStationName(s1.name, s1.city).toLowerCase().replace(/[^a-z0-9]/g, '');
  const n2 = cleanStationName(s2.name, s2.city).toLowerCase().replace(/[^a-z0-9]/g, '');

  const c1 = (s1.city || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const c2 = (s2.city || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const st1 = (s1.state || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const st2 = (s2.state || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // If states are specified and completely different, not duplicate (unless one is Delhi/NCR)
  if (st1 && st2 && st1 !== st2 && !((st1.includes('delhi') || st1.includes('haryana') || st1.includes('uttar')) && (st2.includes('delhi') || st2.includes('haryana') || st2.includes('uttar')))) {
    return false;
  }

  const dist = getDistanceKm(s1.location?.coordinates, s2.location?.coordinates);

  // Exact location match (< 100m)
  if (dist < 0.1) return true;

  // Exact clean name and city match
  if (n1 === n2 && c1 === c2) return true;

  // Proximity (< 2.5km) with matching or contained names
  if (dist < 2.5) {
    if (n1 && n2 && (n1.includes(n2) || n2.includes(n1))) return true;
    if (c1 === c2 && dist < 0.8) return true;
  }

  return false;
}

/**
 * Deduplicate stations in MongoDB, merging reading histories and cleaning orphaned stations.
 */
async function deduplicateAllStations() {
  console.log('[Deduplication] Starting nationwide station deduplication...');
  const allStations = await Station.find({}).lean();
  if (!allStations || allStations.length === 0) {
    return { initialCount: 0, removedCount: 0, finalCount: 0 };
  }

  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < allStations.length; i++) {
    const s1 = allStations[i];
    if (visited.has(s1.stationId)) continue;

    const cluster = [s1];
    visited.add(s1.stationId);

    for (let j = i + 1; j < allStations.length; j++) {
      const s2 = allStations[j];
      if (visited.has(s2.stationId)) continue;

      if (areStationsDuplicate(s1, s2)) {
        cluster.push(s2);
        visited.add(s2.stationId);
      }
    }

    clusters.push(cluster);
  }

  let totalRemoved = 0;

  for (const cluster of clusters) {
    if (cluster.length <= 1) continue;

    // Pick canonical station:
    // Prioritize CPCB or clean IDs, then the one with valid lastAqi, then longest name
    const canonical = cluster.slice().sort((a, b) => {
      // Prioritize cpcb source
      const aIsCpcb = (a.source || '').toLowerCase().includes('cpcb') ? 1 : 0;
      const bIsCpcb = (b.source || '').toLowerCase().includes('cpcb') ? 1 : 0;
      if (aIsCpcb !== bIsCpcb) return bIsCpcb - aIsCpcb;

      // Prioritize having readings/pollutants
      const aAqi = a.lastAqi || 0;
      const bAqi = b.lastAqi || 0;
      if (aAqi > 0 && bAqi === 0) return -1;
      if (bAqi > 0 && aAqi === 0) return 1;

      // Prefer non-hash station IDs (e.g. cpcb-... over waqi-9999)
      const aIsWaqi = a.stationId.startsWith('waqi-') ? 1 : 0;
      const bIsWaqi = b.stationId.startsWith('waqi-') ? 1 : 0;
      if (aIsWaqi !== bIsWaqi) return aIsWaqi - bIsWaqi;

      return 0;
    })[0];

    const cleanedName = cleanStationName(canonical.name, canonical.city);

    // Update canonical station with cleaned name if needed
    await Station.updateOne(
      { _id: canonical._id },
      { $set: { name: cleanedName } }
    );

    const duplicateIds = cluster
      .filter(s => s._id.toString() !== canonical._id.toString())
      .map(s => s.stationId);

    if (duplicateIds.length > 0) {
      // 1. Migrate Readings from duplicate stations to canonical station
      await Reading.updateMany(
        { stationId: { $in: duplicateIds } },
        {
          $set: {
            stationId: canonical.stationId,
            stationName: cleanedName,
            city: canonical.city,
            state: canonical.state,
            location: canonical.location
          }
        }
      );

      // 2. Migrate Alerts if any
      await Alert.updateMany(
        { stationId: { $in: duplicateIds } },
        { $set: { stationId: canonical.stationId } }
      );

      // 3. Migrate Reports if any
      await Report.updateMany(
        { stationId: { $in: duplicateIds } },
        { $set: { stationId: canonical.stationId } }
      );

      // 4. Delete the duplicate stations
      const deleteResult = await Station.deleteMany({
        stationId: { $in: duplicateIds }
      });

      totalRemoved += (deleteResult.deletedCount || duplicateIds.length);
    }
  }

  const finalCount = await Station.countDocuments();
  console.log(`[Deduplication] Finished! Removed ${totalRemoved} duplicate stations. Total unique stations remaining: ${finalCount}`);

  return {
    initialCount: allStations.length,
    removedCount: totalRemoved,
    finalCount
  };
}

module.exports = {
  cleanStationName,
  getDistanceKm,
  areStationsDuplicate,
  deduplicateAllStations
};
