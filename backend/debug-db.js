const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function checkDb() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    
    // Check Events
    const events = await db.collection('events').find({}).toArray();
    console.log('Total Events:', events.length);
    if (events.length > 0) {
      console.log('First Event:', JSON.stringify(events[0], null, 2));
    }

    // Check Venues
    const venues = await db.collection('venues').find({}).toArray();
    console.log('Total Venues:', venues.length);
    if (venues.length > 0) {
      console.log('First Venue:', JSON.stringify(venues[0], null, 2));
    }

    // Check Zones
    const zones = await db.collection('zones').find({}).toArray();
    console.log('Total Zones:', zones.length);

    // Check Seats
    const seats = await db.collection('seats').find({}).toArray();
    console.log('Total Seats:', seats.length);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDb();
