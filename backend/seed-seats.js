const mongoose = require('mongoose');

const uri = "mongodb+srv://neerajagurram777_db_user:nVM8v6FYYpUVoQdm@cluster0.ugip8wc.mongodb.net/ETS_DB";

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');
    const db = mongoose.connection.db;
    const eventId = "6971d366ea5645dcaf823b86";
    const eventIdObj = new mongoose.Types.ObjectId(eventId);
    
    const event = await db.collection('events').findOne({ _id: eventIdObj });
    if (!event) {
        console.error('Event not found');
        return;
    }

    console.log('Event structure keys:', Object.keys(event));
    
    const seatsToSeed = event.seats || [];
    const zonesToSeed = event.zones || [];
    
    console.log(`Found ${seatsToSeed.length} seats and ${zonesToSeed.length} zones embedded.`);

    // 1. Create Zones
    const zoneMap = {}; // s_id -> mongo _id
    for (const z of zonesToSeed) {
        const existingZone = await db.collection('zones').findOne({ 
            eventId: eventIdObj,
            name: z.name || z.id 
        });
        
        if (!existingZone) {
            const res = await db.collection('zones').insertOne({
                eventId: eventIdObj,
                name: z.name || z.id,
                price: z.base_price || 100,
                currency: 'ZAR',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            zoneMap[z.id] = res.insertedId;
            console.log(`Created zone: ${z.name || z.id}`);
        } else {
            zoneMap[z.id] = existingZone._id;
            console.log(`Zone already exists: ${z.name || z.id}`);
        }
    }

    // 2. Create Seats
    const seatsToInsert = [];
    for (const s of seatsToSeed) {
        const zoneObjectId = zoneMap[s.z_id];
        if (!zoneObjectId) {
            console.warn(`No zone ID found for seat ${s.s_id}, zone ref ${s.z_id}`);
            continue;
        }

        const seatData = {
            eventId: eventIdObj,
            zoneId: zoneObjectId,
            row: s.row || '?',
            seatNumber: s.num ? s.num.toString() : s.s_id,
            status: 'AVAILABLE',
            position: { x: s.x || 0, y: s.y || 0 },
            isAccessible: false,
            isAisle: false
        };
        
        // Use s_id or check existence
        const existingSeat = await db.collection('seats').findOne({
            eventId: eventIdObj,
            row: seatData.row,
            seatNumber: seatData.seatNumber
        });

        if (!existingSeat) {
            seatsToInsert.push(seatData);
        }
    }

    if (seatsToInsert.length > 0) {
        const res = await db.collection('seats').insertMany(seatsToInsert);
        console.log(`Inserted ${res.insertedCount} seats.`);
    } else {
        console.log('No new seats to insert.');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

seed();
