const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const events = await db.collection('events').find({}).toArray();
  
  for (const event of events) {
      const seatsCount = event.seats ? event.seats.length : 0;
      if (seatsCount > 0) {
          console.log(`Event ID: ${event._id}, Name: ${event.name}, Seats: ${seatsCount}`);
      }
  }
  
  await mongoose.disconnect();
}
check();
