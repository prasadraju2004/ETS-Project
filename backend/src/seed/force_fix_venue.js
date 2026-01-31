const mongoose = require('mongoose');
const uri =
  process.env.DB_URI ||
  'mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB';

const run = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected');

    const eventId = '6971d366ea5645dcaf823b82';

    // 1. Find ANY valid venue
    const validVenue = await mongoose.connection
      .collection('venues')
      .findOne({});
    if (!validVenue) {
      console.log('NO VENUES FOUND IN DB');
      return;
    }
    console.log('Found Valid Venue:', validVenue._id, validVenue.name);

    // 2. Update Event
    const res = await mongoose.connection
      .collection('events')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(eventId) },
        { $set: { venueId: validVenue._id } },
      );

    console.log('Updated Event VenueId to:', validVenue._id);
    console.log('Modified Count:', res.modifiedCount);
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

run();
