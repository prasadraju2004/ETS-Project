const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function checkVenues() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const venues = await db.collection('venues').find({}).toArray();
  console.log(`Found ${venues.length} venues`);
  venues.forEach(v => {
      console.log(`_id: ${v._id} (type: ${typeof v._id}), name: ${v.name}`);
      if (v.sections) console.log(`  Sections: ${v.sections.length}`);
      if (v.id) console.log(`  id: ${v.id}`);
  });
  await mongoose.disconnect();
}
checkVenues();
