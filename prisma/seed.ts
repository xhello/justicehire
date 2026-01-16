import { PrismaClient } from '../node_modules/.prisma/client/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create businesses
  const oceanviewGrill = await prisma.business.upsert({
    where: { placeId: 'fake-place-oceanview-grill' },
    update: {},
    create: {
      placeId: 'fake-place-oceanview-grill',
      name: 'Oceanview Grill',
      address: '123 Harbor Street',
      city: 'Crescent City',
      state: 'CA',
      category: 'Restaurant',
    },
  })

  const redwoodCoastHotel = await prisma.business.upsert({
    where: { placeId: 'fake-place-redwood-coast-hotel' },
    update: {},
    create: {
      placeId: 'fake-place-redwood-coast-hotel',
      name: 'Redwood Coast Hotel',
      address: '456 Redwood Avenue',
      city: 'Brookings',
      state: 'OR',
      category: 'Hotel',
    },
  })

  const sunsetBrewery = await prisma.business.upsert({
    where: { placeId: 'fake-place-sunset-brewery' },
    update: {},
    create: {
      placeId: 'fake-place-sunset-brewery',
      name: 'Sunset Brewery',
      address: '789 Main Street',
      city: 'Eureka',
      state: 'CA',
      category: 'Brewery',
    },
  })

  console.log('Created businesses')

  // Create employers
  const johnMiller = await prisma.user.upsert({
    where: { email: 'john.miller@example.com' },
    update: {},
    create: {
      email: 'john.miller@example.com',
      role: 'EMPLOYER',
      firstName: 'John',
      lastName: 'Miller',
      verified: true,
      state: 'CA',
      city: 'Crescent City',
      photoUrl: 'https://i.pravatar.cc/150?img=12',
      employerProfile: {
        create: {
          businessId: oceanviewGrill.id,
        },
      },
    },
  })

  const sarahThompson = await prisma.user.upsert({
    where: { email: 'sarah.thompson@example.com' },
    update: {},
    create: {
      email: 'sarah.thompson@example.com',
      role: 'EMPLOYER',
      firstName: 'Sarah',
      lastName: 'Thompson',
      verified: true,
      state: 'OR',
      city: 'Brookings',
      photoUrl: 'https://i.pravatar.cc/150?img=47',
      employerProfile: {
        create: {
          businessId: redwoodCoastHotel.id,
        },
      },
    },
  })

  console.log('Created employers')

  // Create employees
  const alexRivera = await prisma.user.upsert({
    where: { email: 'alex.rivera@example.com' },
    update: {},
    create: {
      email: 'alex.rivera@example.com',
      role: 'EMPLOYEE',
      firstName: 'Alex',
      lastName: 'Rivera',
      verified: true,
      socialUrl: 'https://instagram.com/alexrivera',
      photoUrl: 'https://i.pravatar.cc/150?img=33',
    },
  })

  const emilyChen = await prisma.user.upsert({
    where: { email: 'emily.chen@example.com' },
    update: {},
    create: {
      email: 'emily.chen@example.com',
      role: 'EMPLOYEE',
      firstName: 'Emily',
      lastName: 'Chen',
      verified: true,
      socialUrl: 'https://facebook.com/emilychen',
      photoUrl: 'https://i.pravatar.cc/150?img=45',
    },
  })

  const marcusLee = await prisma.user.upsert({
    where: { email: 'marcus.lee@example.com' },
    update: {},
    create: {
      email: 'marcus.lee@example.com',
      role: 'EMPLOYEE',
      firstName: 'Marcus',
      lastName: 'Lee',
      verified: true,
      socialUrl: 'https://instagram.com/marcuslee',
      photoUrl: 'https://i.pravatar.cc/150?img=68',
    },
  })

  console.log('Created employees')

  // Delete existing reviews first
  await prisma.review.deleteMany({})

  // Create reviews
  // Alex → John (Oceanview Grill) → OUTSTANDING
  await prisma.review.create({
    data: {
      reviewerId: alexRivera.id,
      targetType: 'EMPLOYER',
      targetUserId: johnMiller.id,
      businessId: oceanviewGrill.id,
      rating: 'OUTSTANDING',
    },
  })

  // Emily → John (Oceanview Grill) → DELIVERED_AS_EXPECTED
  await prisma.review.create({
    data: {
      reviewerId: emilyChen.id,
      targetType: 'EMPLOYER',
      targetUserId: johnMiller.id,
      businessId: oceanviewGrill.id,
      rating: 'DELIVERED_AS_EXPECTED',
    },
  })

  // Marcus → Sarah (Redwood Coast Hotel) → GOT_NOTHING_NICE_TO_SAY
  await prisma.review.create({
    data: {
      reviewerId: marcusLee.id,
      targetType: 'EMPLOYER',
      targetUserId: sarahThompson.id,
      businessId: redwoodCoastHotel.id,
      rating: 'GOT_NOTHING_NICE_TO_SAY',
    },
  })

  // John → Alex → OUTSTANDING
  await prisma.review.create({
    data: {
      reviewerId: johnMiller.id,
      targetType: 'EMPLOYEE',
      targetUserId: alexRivera.id,
      businessId: oceanviewGrill.id,
      rating: 'OUTSTANDING',
    },
  })

  // Sarah → Emily → DELIVERED_AS_EXPECTED
  await prisma.review.create({
    data: {
      reviewerId: sarahThompson.id,
      targetType: 'EMPLOYEE',
      targetUserId: emilyChen.id,
      businessId: redwoodCoastHotel.id,
      rating: 'DELIVERED_AS_EXPECTED',
    },
  })

  console.log('Created reviews')
  console.log('Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
