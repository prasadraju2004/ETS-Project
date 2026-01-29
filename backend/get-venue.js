const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function getEventDetails() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const eventId = "6971d366ea5645dcaf823b86";
    
    const event = await db.collection('events').findOne({ _id: new mongoose.Types.ObjectId(eventId) });
    if (event) {
        console.log('Event Name:', event.name);
        console.log('Venue ID:', event.venueId);
        console.log('Venue ID Type:', typeof event.venueId);
        
        let venue;
        if (typeof event.venueId === 'string') {
            venue = await db.collection('venues').findOne({ _id: new mongoose.Types.ObjectId(event.venueId) });
            if (!venue) venue = await db.collection('venues').findOne({ _id: event.venueId });
        } else {
            venue = await db.collection('venues').findOne({ _id: event.venueId });
        }
        
        console.log('Venue found:', venue ? venue.name : 'NOT FOUND');
        if (venue) {
            console.log('Venue ID used:', venue._id);
            console.log('Sections count:', venue.sections ? venue.sections.length : 0);
        }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

getEventDetails();
