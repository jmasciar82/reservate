import * as mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/reservate');
  console.log('Connected');

  const Court = mongoose.model('Court', new mongoose.Schema({}, { strict: false }));
  const Club = mongoose.model('Club', new mongoose.Schema({}, { strict: false }));

  const courts = await Court.find({});
  console.log('Total courts:', courts.length);
  courts.forEach((c: any) => {
    console.log(`Court: ${c.name}, clubId: ${c.clubId}, isActive: ${c.isActive}`);
  });

  const clubs = await Club.find({});
  console.log('Clubs:');
  clubs.forEach((c: any) => {
    console.log(`Club: ${c.name}, id: ${c._id}`);
  });

  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
