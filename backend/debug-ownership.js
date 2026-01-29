const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function debug() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const eventId = "6971d366ea5645dcaf823b86";
  const eventIdObj = new mongoose.Types.ObjectId(eventId);

  const seats = await db.collection('seats').find({ eventId: eventIdObj }).toArray();
  const locks = await db.collection('seatlocks').find({}).toArray();

  console.log('--- SEATS ---');
  seats.filter(s => s.status !== 'AVAILABLE').forEach(s => {
      console.log(`Seat: ${s.row}-${s.seatNumber} | Status: ${s.status} | heldBy: ${s.heldBy} | Type: ${typeof s.heldBy}`);
  });

  console.log('--- LOCKS ---');
  locks.forEach(l => {
      console.log(`Lock: ${l.eventSeatId} | userId: ${l.userId} | Type: ${typeof l.userId}`);
  });

  await mongoose.disconnect();
}
debug();
