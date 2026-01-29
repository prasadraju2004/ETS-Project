const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function verifySeeding() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const eventId = "6971d366ea5645dcaf823b86";
  const eventIdObj = new mongoose.Types.ObjectId(eventId);

  const seatsCount = await db.collection('seats').countDocuments({ eventId: eventIdObj });
  console.log(`Seats count (ObjectId): ${seatsCount}`);

  const seatsCountStr = await db.collection('seats').countDocuments({ eventId: eventId });
  console.log(`Seats count (String): ${seatsCountStr}`);

  const zonesCount = await db.collection('zones').countDocuments({ eventId: eventIdObj });
  console.log(`Zones count (ObjectId): ${zonesCount}`);

  await mongoose.disconnect();
}
verifySeeding();
