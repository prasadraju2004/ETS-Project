const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function updateEvent() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const eventId = "6971d366ea5645dcaf823b86";
  
  // Find a venue with mapDimensions
  const venue = await db.collection('venues').findOne({ mapDimensions: { $exists: true } });
  
  if (venue) {
      console.log('Using venue:', venue.name, 'ID:', venue._id);
      await db.collection('events').updateOne(
          { _id: new mongoose.Types.ObjectId(eventId) },
          { $set: { venueId: venue._id } }
      );
      console.log('Event updated with venueId.');
  } else {
      // Create a fallback venue if none has dimensions
      const res = await db.collection('venues').insertOne({
          name: 'Default Stadium',
          city: 'Johannesburg',
          mapDimensions: { width: 800, height: 600 },
          sections: [
              { sectionId: 's1', name: 'Section A', color: '#9333EA', boundary: [{x:100,y:100}, {x:700,y:100}, {x:700,y:500}, {x:100,y:500}], seats: [] }
          ],
          isActive: true
      });
      await db.collection('events').updateOne(
          { _id: new mongoose.Types.ObjectId(eventId) },
          { $set: { venueId: res.insertedId } }
      );
      console.log('Created and assigned fallback venue.');
  }
  
  await mongoose.disconnect();
}
updateEvent();
