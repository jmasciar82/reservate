const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb://localhost:27017/reservate');
  console.log('Connected');

  const Reservation = mongoose.model('Reservation', new mongoose.Schema({}, { strict: false }));

  const res = await Reservation.find({});
  let migrated = 0;
  for (const c of res) {
    if (typeof c.courtId === 'string') {
      await Reservation.updateOne(
        { _id: c._id },
        { $set: { courtId: new mongoose.Types.ObjectId(c.courtId) } }
      );
      migrated++;
    }
  }

  console.log(`Migrated ${migrated} reservations.`);
  process.exit(0);
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
