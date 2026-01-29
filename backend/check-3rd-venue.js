const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const venues = await db.collection('venues').find({}).toArray();
  const v = venues[2];
  if (v) {
      console.log(`_id: ${v._id} (${typeof v._id}), name: ${v.name}`);
      console.log(`Keys: ${Object.keys(v)}`);
      if (v.sections) console.log(`Sections count: ${v.sections.length}`);
      if (v.seats) console.log(`Seats count: ${v.seats.length}`);
      if (v.zones) console.log(`Zones count: ${v.zones.length}`);
  }
  await mongoose.disconnect();
}
check();
