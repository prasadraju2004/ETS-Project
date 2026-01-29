const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function getEventDetails() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const eventId = "6971d366ea5645dcaf823b86";
    
    const event = await db.collection('events').findOne({ _id: new mongoose.Types.ObjectId(eventId) });
    console.log('Event Details:', JSON.stringify(event, null, 2));

    if (event && event.venueId) {
        const venue = await db.collection('venues').findOne({ _id: event.venueId });
        console.log('Venue found by venueId:', venue ? venue.name : 'NOT FOUND');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

getEventDetails();
