const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/aqi_system');
  const Station = require('./src/models/Station');
  const Reading = require('./src/models/Reading');

  // 1. Delete foreign stations
  const foreignDel = await Station.deleteMany({
    $or: [
      { country: { $ne: 'IN' } },
      { state: 'International' },
      { city: { $in: ['London', 'New York', 'Tokyo', 'Paris'] } },
      { stationId: { $in: ['nyc-midtown', 'lon-bloomsbury', 'tok-shinjuku', 'nyc-central-park', 'lon-marylebone', 'par-champs'] } }
    ]
  });
  console.log('Deleted foreign stations:', foreignDel.deletedCount);

  // 2. Fix or delete stations with empty or missing state
  const badStateStations = await Station.find({
    $or: [
      { state: { $exists: false } },
      { state: null },
      { state: '' },
      { state: 'Unknown' }
    ]
  });
  console.log('Stations with bad state:', badStateStations.length);

  for (const st of badStateStations) {
    let correctedState = null;
    const lowerCity = (st.city || '').toLowerCase();
    if (lowerCity.includes('delhi')) correctedState = 'Delhi';
    else if (lowerCity.includes('mumbai')) correctedState = 'Maharashtra';
    else if (lowerCity.includes('bengaluru') || lowerCity.includes('bangalore')) correctedState = 'Karnataka';
    else if (lowerCity.includes('kolkata')) correctedState = 'West Bengal';
    else if (lowerCity.includes('chennai')) correctedState = 'Tamil Nadu';
    else if (lowerCity.includes('hyderabad')) correctedState = 'Telangana';

    if (correctedState) {
      st.state = correctedState;
      await st.save();
      await Reading.updateMany({ stationId: st.stationId }, { $set: { state: correctedState } });
      console.log(`Updated station ${st.name} (${st.city}) -> state: ${correctedState}`);
    } else {
      await Station.deleteOne({ _id: st._id });
      await Reading.deleteMany({ stationId: st.stationId });
      console.log(`Deleted unresolvable station ${st.stationId}`);
    }
  }

  // 3. Remove duplicate station IDs if any
  const allStations = await Station.find({});
  console.log('Cleaned station count:', allStations.length);

  // Print all distinct states
  const states = [...new Set(allStations.map(s => s.state))].sort();
  console.log('Distinct active Indian states:', states);

  process.exit(0);
}

run();
