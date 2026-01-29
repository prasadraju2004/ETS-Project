const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function getEventKeys() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const eventId = "6971d366ea5645dcaf823b86";
    
    const event = await db.collection('events').findOne({ _id: new mongoose.Types.ObjectId(eventId) });
    if (event) {
        console.log('Event Keys:', Object.keys(event));
        if (event.seats) {
            console.log('Embedded Seats length:', event.seats.length);
            console.log('Sample embedded seat:', JSON.stringify(event.seats[0], null, 2));
        }
        if (event.zones) {
            console.log('Embedded Zones length:', event.zones.length);
            console.log('Sample embedded zone:', JSON.stringify(event.zones[0], null, 2));
        }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

getEventKeys();
