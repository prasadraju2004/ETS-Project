const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function syncZones() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const eventId = "6971d366ea5645dcaf823b86";
  const eventIdObj = new mongoose.Types.ObjectId(eventId);

  const zones = await db.collection('zones').find({ eventId: eventIdObj }).toArray();
  
  if (zones.length > 0) {
      // Map to the format expected by frontend if it looks for an array of zones
      // or map to zonePricing if it looks for a Map.
      // The SeatingPage looks for event.zones (array) and then populates a map.
      await db.collection('events').updateOne(
          { _id: eventIdObj },
          { $set: { zones: zones } }
      );
      console.log(`Synced ${zones.length} zones to Event document.`);
  }

  await mongoose.disconnect();
}
syncZones();
