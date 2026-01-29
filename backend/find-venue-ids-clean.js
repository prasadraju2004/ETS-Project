const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function findVenue() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const venues = await db.collection('venues').find({}).toArray();
  venues.forEach(v => {
      console.log(`ID: ${v._id} | Name: ${v.name}`);
  });
  await mongoose.disconnect();
}
findVenue();
