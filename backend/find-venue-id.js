const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function findVenue() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const venues = await db.collection('venues').find({}).toArray();
  for (const v of venues) {
      console.log(`Venue ID: ${v._id}, Name: ${v.name}`);
  }
  await mongoose.disconnect();
}
findVenue();
