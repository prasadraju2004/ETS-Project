const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function inspectVenue() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const venues = await db.collection('venues').find({}).toArray();
  if (venues.length < 2) {
      console.log('Only 1 venue found');
      return;
  }
  const venue = venues[1];
  console.log('Venue:', venue.name);
  console.log('Sections:', venue.sections ? venue.sections.length : 0);
  if (venue.sections && venue.sections.length > 0) {
      const section = venue.sections[0];
      console.log('Section 0:', section.name, 'Seats:', section.seats ? section.seats.length : 0);
  }
  await mongoose.disconnect();
}
inspectVenue();
