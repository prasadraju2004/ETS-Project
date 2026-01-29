const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function seedSeats() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');
    const db = mongoose.connection.db;
    const eventId = "6971d366ea5645dcaf823b86";
    const eventIdObj = new mongoose.Types.ObjectId(eventId);

    // 1. Clean existing zones and seats for this event to avoid duplicates during seeding
    await db.collection('zones').deleteMany({ eventId: eventIdObj });
    await db.collection('seats').deleteMany({ eventId: eventIdObj });

    // 2. Create Zones
    const zonesData = [
      { name: 'Section A', price: 350, color: '#9333EA' },
      { name: 'Section B', price: 250, color: '#FF6B6B' },
      { name: 'Section C', price: 150, color: '#4ADE80' }
    ];

    const zones = [];
    for (const z of zonesData) {
      const res = await db.collection('zones').insertOne({
        eventId: eventIdObj,
        name: z.name,
        price: z.price,
        currency: 'ZAR',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      zones.push({ ...z, _id: res.insertedId });
    }
    console.log(`Created ${zones.length} zones.`);

    // 3. Create Seats
    const seats = [];
    const layout = [
      { row: 'A', count: 12, zoneIndex: 0, y: 150 },
      { row: 'B', count: 12, zoneIndex: 0, y: 180 },
      { row: 'C', count: 14, zoneIndex: 1, y: 240 },
      { row: 'D', count: 14, zoneIndex: 1, y: 270 },
      { row: 'E', count: 16, zoneIndex: 2, y: 330 },
      { row: 'F', count: 16, zoneIndex: 2, y: 360 },
      { row: 'G', count: 16, zoneIndex: 2, y: 390 },
      { row: 'H', count: 16, zoneIndex: 2, y: 420 },
    ];

    for (const rowConfig of layout) {
      const startX = 400 - (rowConfig.count * 30) / 2;
      for (let i = 1; i <= rowConfig.count; i++) {
        seats.push({
          eventId: eventIdObj,
          zoneId: zones[rowConfig.zoneIndex]._id,
          row: rowConfig.row,
          seatNumber: i.toString(),
          status: 'AVAILABLE',
          position: {
            x: startX + (i - 1) * 30,
            y: rowConfig.y
          },
          isAccessible: false,
          isAisle: i === 1 || i === rowConfig.count
        });
      }
    }

    if (seats.length > 0) {
      const res = await db.collection('seats').insertMany(seats);
      console.log(`Successfully seeded ${res.insertedCount} seats for event ${eventId}.`);
    }

    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

seedSeats();
