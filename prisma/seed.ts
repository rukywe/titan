import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingFunds = await prisma.fund.count();
  if (existingFunds > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  const fund1 = await prisma.fund.create({
    data: {
      name: 'Titanbay Growth Fund I',
      vintageYear: 2024,
      targetSizeUsd: '250000000',
      status: 'Fundraising'
    }
  });

  const fund2 = await prisma.fund.create({
    data: {
      name: 'Titanbay Venture Fund II',
      vintageYear: 2023,
      targetSizeUsd: '150000000',
      status: 'Investing'
    }
  });

  const fund3 = await prisma.fund.create({
    data: {
      name: 'Titanbay Capital Fund 2022',
      vintageYear: 2022,
      targetSizeUsd: '100000000',
      status: 'Closed'
    }
  });

  const investor1 = await prisma.investor.create({
    data: {
      name: 'Goldman Sachs Asset Management',
      investorType: 'Institution',
      email: 'investments@gsam.com'
    }
  });

  const investor2 = await prisma.investor.create({
    data: {
      name: 'CalPERS',
      investorType: 'Institution',
      email: 'privateequity@calpers.ca.gov'
    }
  });

  const investor3 = await prisma.investor.create({
    data: {
      name: 'BlackRock Private Equity',
      investorType: 'Institution',
      email: 'pe@blackrock.com'
    }
  });

  await prisma.investment.create({
    data: {
      investorId: investor1.id,
      fundId: fund1.id,
      amountUsd: '50000000',
      investmentDate: new Date('2025-10-05')
    }
  });

  await prisma.investment.create({
    data: {
      investorId: investor2.id,
      fundId: fund1.id,
      amountUsd: '75000000',
      investmentDate: new Date('2025-10-10')
    }
  });

  await prisma.investment.create({
    data: {
      investorId: investor3.id,
      fundId: fund2.id,
      amountUsd: '30000000',
      investmentDate: new Date('2025-10-08')
    }
  });

  await prisma.investment.create({
    data: {
      investorId: investor1.id,
      fundId: fund2.id,
      amountUsd: '40000000',
      investmentDate: new Date('2025-10-12')
    }
  });

  await prisma.investment.create({
    data: {
      investorId: investor3.id,
      fundId: fund1.id,
      amountUsd: '25000000',
      investmentDate: new Date('2025-10-15')
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
