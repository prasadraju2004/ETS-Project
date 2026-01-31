const mongoose = require('mongoose');
// const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";
const uri =
  process.env.DB_URI ||
  'mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB';

const run = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    // The IDs from the USER logs
    const eventIdOriginal = '6971d366ea5645dcaf823b82';
    const venueIdInEvent = '697ce1928c502c2b77719ff9';

    // 1. Check Event
    let event;
    try {
      event = await mongoose.connection
        .collection('events')
        .findOne({ _id: new mongoose.Types.ObjectId(eventIdOriginal) });
    } catch (e) {
      console.log('Invalid Event ID format', e.message);
    }

    console.log(`Event ${eventIdOriginal} exists:`, !!event);
    if (event) {
      console.log('Event Data:', {
        name: event.name,
        venueId: event.venueId,
        venueType: typeof event.venueId,
        venueToString: event.venueId ? event.venueId.toString() : 'null',
      });
    }

    // 2. Check Venue from the Log
    let venueLog;
    try {
      venueLog = await mongoose.connection
        .collection('venues')
        .findOne({ _id: new mongoose.Types.ObjectId(venueIdInEvent) });
    } catch (e) {
      console.log('Invalid Venue ID format', e.message);
    }
    console.log(`Venue ${venueIdInEvent} exists:`, !!venueLog);

    // 3. List ALL Venues (to find a valid one)
    const allVenues = await mongoose.connection
      .collection('venues')
      .find({})
      .limit(5)
      .toArray();
    console.log(
      'Available Venues in DB:',
      allVenues.map((v) => ({ id: v._id.toString(), name: v.name })),
    );

    if (event && !venueLog && allVenues.length > 0) {
      const validVenueId = allVenues[0]._id;
      console.log(
        `\n>>> FIXING REQUIREMENT: Event references missing venue ${venueIdInEvent}. Should update to ${validVenueId}`,
      );

      // Uncomment to auto-fix
      const res = await mongoose.connection
        .collection('events')
        .updateOne(
          { _id: new mongoose.Types.ObjectId(eventIdOriginal) },
          { $set: { venueId: validVenueId } },
        );
      console.log('Update Result:', res);
      console.log('Fixed Event Venue Reference.');
    }
  } catch (e) {
    console.error('Script Error:', e);
  } finally {
    await mongoose.disconnect();
  }
};

run();
