import { pool } from './client';

async function seed() {
  console.log('Seeding database...');

  // Clear existing data
  await pool.query('TRUNCATE leads, jobs, users RESTART IDENTITY CASCADE');

  // 1 admin (Vahan Leader)
  await pool.query(`
    INSERT INTO users (name, email, role) VALUES
    ('Priya Sharma', 'priya@vahan.co', 'admin')
  `);

  // 2 team leaders
  await pool.query(`
    INSERT INTO users (name, email, role, team_leader_id) VALUES
    ('Rohit Verma', 'rohit@vahan.co', 'team_leader', 1),
    ('Anjali Singh', 'anjali@vahan.co', 'team_leader', 1)
  `);

  // 5 TCs (telecallers) - some assigned to Rohit, some to Anjali
  await pool.query(`
    INSERT INTO users (name, email, role, team_leader_id) VALUES
    ('Amit Kumar', 'amit@vahan.co', 'tc', 2),
    ('Neha Gupta', 'neha@vahan.co', 'tc', 2),
    ('Vikash Yadav', 'vikash@vahan.co', 'tc', 3),
    ('Pooja Mehta', 'pooja@vahan.co', 'tc', 3),
    ('Suresh Patel', 'suresh@vahan.co', 'tc', 3)
  `);

  // Jobs across multiple cities
  await pool.query(`
    INSERT INTO jobs (title, company, city) VALUES
    ('Delivery Executive', 'Swiggy', 'Bengaluru'),
    ('Delivery Executive', 'Zomato', 'Bengaluru'),
    ('Bike Rider', 'Dunzo', 'Mumbai'),
    ('Delivery Partner', 'Flipkart', 'Delhi'),
    ('Delivery Executive', 'Amazon', 'Hyderabad'),
    ('Rider', 'Rapido', 'Bengaluru')
  `);

  // 50 existing leads - includes some duplicates we can dedup against
  const leadInserts: string[] = [];
  const phones = [
    '9876543210', '9876543211', '9876543212', '9876543213', '9876543214',
    '9876543215', '9876543216', '9876543217', '9876543218', '9876543219',
    '9988776600', '9988776601', '9988776602', '9988776603', '9988776604',
    '9988776605', '9988776606', '9988776607', '9988776608', '9988776609',
    '8123456700', '8123456701', '8123456702', '8123456703', '8123456704',
    '8123456705', '8123456706', '8123456707', '8123456708', '8123456709',
    '7654321000', '7654321001', '7654321002', '7654321003', '7654321004',
    '7654321005', '7654321006', '7654321007', '7654321008', '7654321009',
    '9123456780', '9123456781', '9123456782', '9123456783', '9123456784',
    '9123456785', '9123456786', '9123456787', '9123456788', '9123456789',
  ];
  const cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad'];
  const statuses = ['NEW', 'CONTACTED', 'INTERESTED', 'REJECTED'];

  for (let i = 0; i < 50; i++) {
    const name = `Existing Lead ${i + 1}`;
    const phone = phones[i];
    const city = cities[i % cities.length];
    const jobId = (i % 6) + 1;
    const status = statuses[i % statuses.length];
    const tcId = (i % 5) + 4; // TC user IDs are 4-8
    const referredBy = 1; // admin
    leadInserts.push(
      `('${name}', '${phone}', '${city}', ${jobId}, '${status}', ${tcId}, ${referredBy})`
    );
  }

  await pool.query(`
    INSERT INTO leads (name, phone, city, job_id, status, assigned_tc_id, referred_by)
    VALUES ${leadInserts.join(',\n')}
  `);

  console.log('Seed complete: 8 users, 6 jobs, 50 leads');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
