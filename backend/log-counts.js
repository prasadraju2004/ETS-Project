const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const eventId = "6971d366ea5645dcaf823b86";
  const event = await db.collection('events').findOne({ _id: new mongoose.Types.ObjectId(eventId) });
  
  const hasSeats = !!event.seats;
  const seatsCount = hasSeats ? event.seats.length : 0;
  const hasZones = !!event.zones;
  const zonesCount = hasZones ? event.zones.length : 0;
  
  console.log(`Event: ${event.name}`);
  console.log(`Has embedded seats: ${hasSeats} (${seatsCount})`);
  console.log(`Has embedded zones: ${hasZones} (${zonesCount})`);
  
  if (hasZones && zonesCount > 0) {
      console.log('Zone 1:', JSON.stringify(event.zones[0]));
  }
  
  if (hasSeats && seatsCount > 0) {
      console.log('Seat 1:', JSON.stringify(event.seats[0]));
  }
  
  await mongoose.disconnect();
}
check();
