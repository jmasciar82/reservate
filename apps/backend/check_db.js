const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/reservate');
  console.log('Connected');

  const Court = mongoose.model('Court', new mongoose.Schema({}, { strict: false }));

  const courts = await Court.find({});
  courts.forEach(c => {
    console.log(`Court: ${c.name}, clubId type: ${typeof c.clubId}, constructor: ${c.clubId && c.clubId.constructor.name}`);
  });

  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
