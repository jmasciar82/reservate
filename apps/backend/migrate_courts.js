const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb://localhost:27017/reservate');
  console.log('Connected');

  const Court = mongoose.model('Court', new mongoose.Schema({}, { strict: false }));

  const courts = await Court.find({});
  let migrated = 0;
  for (const c of courts) {
    if (typeof c.clubId === 'string') {
      await Court.updateOne(
        { _id: c._id },
        { $set: { clubId: new mongoose.Types.ObjectId(c.clubId) } }
      );
      migrated++;
    }
  }

  console.log(`Migrated ${migrated} courts.`);
  process.exit(0);
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
