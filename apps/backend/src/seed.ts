import mongoose from 'mongoose';
import { ClubSchema } from './modules/clubs/schemas/club.schema';
import { CourtSchema } from './modules/courts/schemas/court.schema';
import { ReservationSchema } from './modules/reservations/schemas/reservation.schema';

const MONGO_URI = 'mongodb://localhost:27017/reservate';

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  const ClubModel = mongoose.model('Club', ClubSchema);
  const CourtModel = mongoose.model('Court', CourtSchema);
  const ReservationModel = mongoose.model('Reservation', ReservationSchema);

  // Clear existing collections
  console.log('Cleaning collections...');
  await ReservationModel.deleteMany({});
  await CourtModel.deleteMany({});
  await ClubModel.deleteMany({});

  // 1. Create Clubs
  console.log('Creating clubs...');
  const club1 = await ClubModel.create({
    name: 'Club Central Paddle',
    location: 'Av. Corrientes 1234, CABA',
    sports: ['padel', 'tennis'],
    description: 'El mejor club del centro con canchas profesionales.',
  });

  const club2 = await ClubModel.create({
    name: 'Club Deportivo San Isidro',
    location: 'Av. Libertador 8000, San Isidro',
    sports: ['padel', 'football'],
    description: 'Complejo multideportivo frente al río.',
  });

  // 2. Create Courts
  console.log('Creating courts...');
  const courts = [
    {
      name: 'Cancha 1 (Cristal)',
      sport: 'padel',
      clubId: club1._id,
      isActive: true,
      isCovered: true,
      pricePerHour: 15000,
    },
    {
      name: 'Cancha 2 (Sintética)',
      sport: 'padel',
      clubId: club1._id,
      isActive: true,
      isCovered: false,
      pricePerHour: 12000,
    },
    {
      name: 'Cancha 3 (Polvo)',
      sport: 'tennis',
      clubId: club1._id,
      isActive: true,
      isCovered: false,
      pricePerHour: 18000,
    },
    {
      name: 'Cancha 1 (Techada)',
      sport: 'padel',
      clubId: club2._id,
      isActive: true,
      isCovered: true,
      pricePerHour: 16000,
    },
    {
      name: 'Cancha 2 (Descubierta)',
      sport: 'padel',
      clubId: club2._id,
      isActive: true,
      isCovered: false,
      pricePerHour: 13000,
    },
    {
      name: 'Fútbol 5 (Sintético)',
      sport: 'football',
      clubId: club2._id,
      isActive: true,
      isCovered: false,
      pricePerHour: 22000,
    },
  ];

  await CourtModel.insertMany(courts);
  console.log('Database seeded successfully!');

  await mongoose.disconnect();
  console.log('Disconnected.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
