const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function checkDb() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const eventId = "6971d366ea5645dcaf823b86";
    
    // Check Event
    const event = await db.collection('events').findOne({ _id: eventId });
    if (event) {
        console.log('Event found:', event.name);
        console.log('Event has zones:', !!event.zones);
        console.log('Event has seats embedded:', !!event.seats);
        if (event.seats) console.log('Embedded seats count:', event.seats.length);
    } else {
        // Try as ObjectId
        const eventObj = await db.collection('events').findOne({ _id: new mongoose.Types.ObjectId(eventId) });
        if (eventObj) {
            console.log('Event found (as ObjectId):', eventObj.name);
        } else {
            console.log('Event NOT found');
        }
    }

    // Check Seats collection for this event
    const seatsCount = await db.collection('seats').countDocuments({ eventId: eventId });
    console.log('Seats in "seats" collection for this string eventId:', seatsCount);

    const seatsCountObj = await db.collection('seats').countDocuments({ eventId: new mongoose.Types.ObjectId(eventId) });
    console.log('Seats in "seats" collection for this ObjectId eventId:', seatsCountObj);

    // If no seats, let's see one seat to check its structure
    const oneSeat = await db.collection('seats').findOne({});
    if (oneSeat) {
        console.log('Sample seat from collection:', JSON.stringify(oneSeat, null, 2));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDb();
