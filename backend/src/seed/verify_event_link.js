const mongoose = require('mongoose');
const uri =
  process.env.DB_URI ||
  'mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB';

const run = async () => {
  try {
    await mongoose.connect(uri);

    const eventId = '6971d366ea5645dcaf823b82';
    console.log('Checking Event:', eventId);

    const event = await mongoose.connection.collection('events').findOne({
      _id: new mongoose.Types.ObjectId(eventId),
    });

    if (event) {
      console.log('Event Name:', event.name);
      console.log('Event VenueId:', event.venueId);
      console.log('Event VenueId Type:', typeof event.venueId);
      if (event.venueId && event.venueId.constructor.name) {
        console.log('Constructor:', event.venueId.constructor.name);
      }
    } else {
      console.log('Event NOT FOUND');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
