const mongoose = require('mongoose');
const uri =
  process.env.DB_URI ||
  'mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB';

const run = async () => {
  try {
    await mongoose.connect(uri);

    const targetId = '697ce1928c502c2b77719ff9';
    console.log('Checking ID:', targetId);

    const venue = await mongoose.connection.collection('venues').findOne({
      _id: new mongoose.Types.ObjectId(targetId),
    });

    if (venue) {
      console.log('Found Venue:', venue.name);
      console.log('ID type:', typeof venue._id);
    } else {
      console.log('Venue NOT FOUND with ObjectId');
      // Try string search just in case
      const vString = await mongoose.connection
        .collection('venues')
        .findOne({ _id: targetId });
      console.log('Venue found by String ID:', !!vString);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
