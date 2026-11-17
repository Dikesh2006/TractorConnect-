const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const Service = require('../models/Service');
const ServicePriceHistory = require('../models/ServicePriceHistory');
const Tractor = require('../models/Tractor');
const Booking = require('../models/Booking');
const WorkRecord = require('../models/WorkRecord');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { round2Decimals } = require('../utils/formatters');

const seedData = async () => {
  console.log('🌱 Starting TractorConnect Multi-Owner Seed Script...\n');

  try {
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Service.deleteMany({}),
      ServicePriceHistory.deleteMany({}),
      Tractor.deleteMany({}),
      Booking.deleteMany({}),
      WorkRecord.deleteMany({}),
      Payment.deleteMany({}),
      Expense.deleteMany({})
    ]);

    // 1. Create Platform Administrator
    console.log('👑 Seeding Platform Admin Account...');
    const adminPasswordHash = await bcrypt.hash(config.admin.password, 10);
    const adminUser = new User({
      name: config.admin.name,
      mobile: config.admin.mobile,
      passwordHash: adminPasswordHash,
      email: 'admin@tractorconnect.in',
      role: 'admin',
      village: 'Sehore City',
      district: 'Sehore',
      state: 'Madhya Pradesh',
      address: 'Near Old Bus Stand, Sehore',
      isApproved: true,
      approvalStatus: 'approved',
      isActive: true
    });
    await adminUser.save();

    // 2. Create Independent Tractor Owners
    console.log('🚜 Seeding Tractor Owners (Approved & Pending)...');
    const ownerPassword = 'Owner@123';
    const ownerPasswordHash = await bcrypt.hash(ownerPassword, 10);

    // Owner 1: Approved - Bilkisganj base
    const owner1 = new User({
      name: 'Rajesh Patidar',
      mobile: '9826111111',
      passwordHash: ownerPasswordHash,
      email: 'rajesh.patidar@tractorconnect.in',
      role: 'owner',
      businessName: 'Patidar Krishi Yantra Seva',
      village: 'Bilkisganj',
      district: 'Sehore',
      state: 'Madhya Pradesh',
      address: 'Near Kisan Mandi, Bilkisganj',
      serviceRadiusKm: 30,
      location: {
        latitude: 23.1845,
        longitude: 77.0825,
        village: 'Bilkisganj',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        fullAddress: 'Main Market Road, Bilkisganj'
      },
      serviceDescription:
        'Professional deep tillage, rotavator bed preparation, and laser leveling with 45-50 HP tractors.',
      isApproved: true,
      approvalStatus: 'approved',
      approvedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      approvedBy: adminUser._id,
      isActive: true
    });
    await owner1.save();

    // Owner 2: Approved - Shyampur base
    const owner2 = new User({
      name: 'Suresh Kumar Mewada',
      mobile: '9826222222',
      passwordHash: ownerPasswordHash,
      email: 'suresh.mewada@tractorconnect.in',
      role: 'owner',
      businessName: 'Mewada Agro & Tractor Services',
      village: 'Shyampur',
      district: 'Sehore',
      state: 'Madhya Pradesh',
      address: 'Gram Shyampur, Tehsil Sehore',
      serviceRadiusKm: 25,
      location: {
        latitude: 23.321,
        longitude: 77.1235,
        village: 'Shyampur',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        fullAddress: 'Bhopal-Shyampur Road'
      },
      serviceDescription:
        'Fast cultivator tilling, multi-crop seed drill sowing, and heavy trolley haulage.',
      isApproved: true,
      approvalStatus: 'approved',
      approvedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      approvedBy: adminUser._id,
      isActive: true
    });
    await owner2.save();

    // Owner 3: Pending verification (for Admin Approval demo)
    const owner3 = new User({
      name: 'Dharmendra Choudhary',
      mobile: '9826333333',
      passwordHash: ownerPasswordHash,
      email: 'dharmendra@tractorconnect.in',
      role: 'owner',
      businessName: 'Narmada Valley Tractor Hiring',
      village: 'Hoshangabad Rural',
      district: 'Narmadapuram',
      state: 'Madhya Pradesh',
      address: 'Canal Road, Babai Marg',
      serviceRadiusKm: 20,
      location: {
        latitude: 22.751,
        longitude: 77.728,
        village: 'Hoshangabad Rural',
        district: 'Narmadapuram',
        state: 'Madhya Pradesh',
        fullAddress: 'Canal Road, Near Sugar Mill'
      },
      serviceDescription: 'New tractor hiring service pending platform documentation review.',
      isApproved: false,
      approvalStatus: 'pending',
      isActive: true
    });
    await owner3.save();

    // 3. Create Farmers (Customers)
    console.log('👨‍🌾 Seeding Indian Farmer Accounts (Customers)...');
    const defaultCustomerPassword = 'Customer@123';
    const customerPasswordHash = await bcrypt.hash(defaultCustomerPassword, 10);

    const rawCustomers = [
      { name: 'Shivraj Singh', mobile: '9826011111', village: 'Bilkisganj', district: 'Sehore', address: 'Ward 3, Near Gram Panchayat' },
      { name: 'Jagdish Meena', mobile: '9826022222', village: 'Mandideep', district: 'Raisen', address: 'Main Road, Bilkisganj Marg' },
      { name: 'Mohanlal Sharma', mobile: '9826033333', village: 'Shyampur', district: 'Sehore', address: 'Krishi Mandi Gate No. 2' },
      { name: 'Dharmendra Yadav', mobile: '9826044444', village: 'Mandi', district: 'Sehore', address: 'Near Primary School' },
      { name: 'Kailash Chand Sharma', mobile: '9826055555', village: 'Doraha', district: 'Sehore', address: 'Bhopal-Indore Highway Side' },
      { name: 'Kamal Kishore Parmar', mobile: '9826066666', village: 'Bherunda', district: 'Sehore', address: 'Narmada Kinar Road' },
      { name: 'Gopal Singh Thakur', mobile: '9826077777', village: 'Ashta', district: 'Sehore', address: 'Near Old Sugar Mill' },
      { name: 'Mahesh Dangi', mobile: '9826088888', village: 'Berasia', district: 'Bhopal', address: 'Gram Panchayat Road' },
      { name: 'Babulal Meena', mobile: '9826099999', village: 'Obaidullaganj', district: 'Raisen', address: 'Station Road' },
      { name: 'Sunil Choudhary', mobile: '9893011111', village: 'Hoshangabad Rural', district: 'Narmadapuram', address: 'Near River Canal' }
    ];

    const customers = await User.insertMany(
      rawCustomers.map((c, idx) => ({
        ...c,
        passwordHash: customerPasswordHash,
        role: 'customer',
        isApproved: true,
        approvalStatus: 'approved',
        state: 'Madhya Pradesh',
        location: {
          latitude: 23.19 + (idx % 3) * 0.05,
          longitude: 77.08 + (idx % 4) * 0.04,
          village: c.village,
          district: c.district,
          state: 'Madhya Pradesh',
          fullAddress: c.address
        },
        isActive: true
      }))
    );

    // 4. Create Owner-Specific Farming Services
    console.log('🌾 Seeding Independent Farming Services for Each Owner...');

    // Owner 1 Services (Patidar Krishi Yantra Seva)
    const owner1RawServices = [
      {
        name: 'Deep Disc Ploughing (डिस्क जुताई)',
        description: 'Deep disc ploughing for soil aeration, stubble burial, and summer prep.',
        category: 'Land Preparation',
        pricingUnit: 'per_acre',
        currentPrice: 850,
        minimumCharge: 500,
        displayOrder: 1
      },
      {
        name: 'High-Speed Rotavator (रोटावेटर)',
        description: 'High-speed rotary tilling for pulverizing soil into fine seedbed.',
        category: 'Land Preparation',
        pricingUnit: 'per_acre',
        currentPrice: 950,
        minimumCharge: 600,
        displayOrder: 2
      },
      {
        name: 'Laser Land Leveler (लेजर लेवलर)',
        description: 'Computerized laser-guided grading to ensure uniform water distribution.',
        category: 'Land Preparation',
        pricingUnit: 'per_hour',
        currentPrice: 900,
        minimumCharge: 900,
        displayOrder: 3
      }
    ];

    const owner1Services = [];
    for (const s of owner1RawServices) {
      const created = new Service({
        ...s,
        owner: owner1._id,
        createdBy: owner1._id,
        updatedBy: owner1._id,
        isActive: true
      });
      await created.save();
      owner1Services.push(created);

      await ServicePriceHistory.create({
        service: created._id,
        price: created.currentPrice,
        pricingUnit: created.pricingUnit,
        effectiveFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        changedBy: owner1._id,
        note: 'Seasonal base rate set by owner'
      });
    }

    // Owner 2 Services (Mewada Agro & Tractor Services)
    const owner2RawServices = [
      {
        name: '9-Tyne Cultivator (कल्टीवेटर)',
        description: 'Secondary tillage and weed eradication with heavy-duty spring cultivator.',
        category: 'Land Preparation',
        pricingUnit: 'per_acre',
        currentPrice: 650,
        minimumCharge: 400,
        displayOrder: 1
      },
      {
        name: 'Zero-Till Seed Drill (सीड ड्रिल बोवनी)',
        description: 'Precision seed and fertilizer placement with adjustable depth.',
        category: 'Sowing & Planting',
        pricingUnit: 'per_acre',
        currentPrice: 750,
        minimumCharge: 500,
        displayOrder: 2
      },
      {
        name: 'Hydraulic Trolley Transport (ट्रॉली ढुलाई)',
        description: 'Transport of harvested grain, sand, manure or farm produce.',
        category: 'Transport & Haulage',
        pricingUnit: 'per_trip',
        currentPrice: 1200,
        minimumCharge: 1200,
        displayOrder: 3
      }
    ];

    const owner2Services = [];
    for (const s of owner2RawServices) {
      const created = new Service({
        ...s,
        owner: owner2._id,
        createdBy: owner2._id,
        updatedBy: owner2._id,
        isActive: true
      });
      await created.save();
      owner2Services.push(created);

      await ServicePriceHistory.create({
        service: created._id,
        price: created.currentPrice,
        pricingUnit: created.pricingUnit,
        effectiveFrom: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        changedBy: owner2._id,
        note: 'Initial seasonal price catalog by owner'
      });
    }

    // 5. Create Tractors for Each Owner
    console.log('🚜 Seeding Tractors Fleet for Owners...');
    const owner1Tractors = await Tractor.insertMany([
      {
        owner: owner1._id,
        name: 'Mahindra 575 DI XP Plus',
        registrationNumber: 'MP-04-AB-1234',
        model: '575 DI XP Plus (47 HP)',
        horsepower: 47,
        status: 'available',
        currentOperatorName: 'Raju Dhakad',
        notes: 'Equipped with heavy duty hydraulic lift and power steering',
        isActive: true
      },
      {
        owner: owner1._id,
        name: 'Swaraj 744 FE',
        registrationNumber: 'MP-04-CD-5678',
        model: '744 FE (48 HP)',
        horsepower: 48,
        status: 'available',
        currentOperatorName: 'Devendra Yadav',
        notes: 'Best suited for rotavator and heavy ploughing',
        isActive: true
      }
    ]);

    const owner2Tractors = await Tractor.insertMany([
      {
        owner: owner2._id,
        name: 'John Deere 5050 D',
        registrationNumber: 'MP-04-EF-9012',
        model: '5050 D (50 HP)',
        horsepower: 50,
        status: 'available',
        currentOperatorName: 'Vikram Singh',
        notes: 'Equipped for seed drill and cultivator operations',
        isActive: true
      },
      {
        owner: owner2._id,
        name: 'Massey Ferguson 241 DI',
        registrationNumber: 'MP-04-GH-3456',
        model: '241 DI Dynatrack (42 HP)',
        horsepower: 42,
        status: 'available',
        currentOperatorName: 'Santosh Meena',
        notes: 'Fuel efficient, ideal for trolley haulage',
        isActive: true
      }
    ]);

    // 6. Generate Bookings, WorkRecords, and Payments Routed to Owners
    console.log('📅 Generating Bookings and Financials for Owners...');
    const crops = ['Soybean', 'Wheat (गेहूँ)', 'Gram / Chana (चना)', 'Mustard (सरसों)'];
    const timeSlots = ['morning', 'afternoon', 'evening'];

    const bookings = [];
    const workRecords = [];
    const payments = [];

    // 24 bookings for Owner 1, 24 bookings for Owner 2
    const totalBookingsCount = 48;
    for (let i = 0; i < totalBookingsCount; i++) {
      const isOwner1 = i % 2 === 0;
      const owner = isOwner1 ? owner1 : owner2;
      const servicePool = isOwner1 ? owner1Services : owner2Services;
      const tractorPool = isOwner1 ? owner1Tractors : owner2Tractors;

      const customer = customers[i % customers.length];
      const service = servicePool[i % servicePool.length];
      const tractor = tractorPool[i % tractorPool.length];

      const daysOffset = Math.floor(Math.random() * 80) - 70;
      const bookingDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);

      const quantity = Math.floor(Math.random() * 6) + 2; // 2 to 7 units
      const rawCost = service.currentPrice * quantity;
      const estimatedCost = round2Decimals(Math.max(rawCost, service.minimumCharge || 0));

      let status = 'completed';
      if (daysOffset > 2) {
        status = i % 3 === 0 ? 'accepted' : 'pending';
      } else if (daysOffset >= 0) {
        status = i % 2 === 0 ? 'scheduled' : 'in_progress';
      } else if (i === 15) {
        status = 'cancelled';
      } else if (i === 21) {
        status = 'rejected';
      }

      const booking = new Booking({
        customer: customer._id,
        tractorOwner: owner._id,
        service: service._id,
        serviceSnapshot: {
          name: service.name,
          pricingUnit: service.pricingUnit,
          unitPrice: service.currentPrice,
          minimumCharge: service.minimumCharge || 0
        },
        estimatedQuantity: quantity,
        estimatedCost,
        requestedDate: bookingDate,
        requestedTimeSlot: timeSlots[i % timeSlots.length],
        fieldLocation: {
          latitude: round2Decimals(23.18 + (i % 5) * 0.03),
          longitude: round2Decimals(77.08 + (i % 5) * 0.03),
          village: customer.village,
          tehsil: 'Sehore',
          district: customer.district,
          state: 'Madhya Pradesh',
          pincode: '466001',
          fullAddress: `${customer.village}, Khasra No. ${100 + i}`,
          landmark: 'Near Canal'
        },
        cropType: crops[i % crops.length],
        customerNotes: `Field moisture suitable for ${service.name}.`,
        status,
        rejectionReason: status === 'rejected' ? 'Tractors already scheduled for local cluster work' : '',
        cancellationReason: status === 'cancelled' ? 'Heavy unseasonal rain' : '',
        cancelledBy: status === 'cancelled' ? customer._id : null,
        scheduledStart: ['scheduled', 'in_progress', 'completed'].includes(status) ? bookingDate : null,
        scheduledEnd: ['scheduled', 'in_progress', 'completed'].includes(status)
          ? new Date(bookingDate.getTime() + 4 * 60 * 60 * 1000)
          : null,
        assignedTractor: ['scheduled', 'in_progress', 'completed'].includes(status) ? tractor._id : null,
        assignedOperatorName: tractor.currentOperatorName,
        statusHistory: [
          {
            status: 'pending',
            changedBy: customer._id,
            changedAt: new Date(bookingDate.getTime() - 2 * 24 * 60 * 60 * 1000),
            note: 'Booking requested by farmer'
          },
          ...(status !== 'pending'
            ? [
                {
                  status,
                  changedBy: owner._id,
                  changedAt: bookingDate,
                  note: `Status updated to ${status} by tractor owner`
                }
              ]
            : [])
        ]
      });

      await booking.save();
      bookings.push(booking);

      if (status === 'completed') {
        const actualQuantity = quantity;
        const actualAcres = service.pricingUnit === 'per_acre' ? actualQuantity : quantity;
        const finalCharge = estimatedCost;
        const discount = i % 6 === 0 ? 100 : 0;
        const extraCharges = i % 8 === 0 ? 150 : 0;
        const totalAmount = round2Decimals(finalCharge - discount + extraCharges);

        let paymentStatus = 'paid';
        let amountPaid = totalAmount;
        if (i % 4 === 1) {
          paymentStatus = 'partially_paid';
          amountPaid = round2Decimals(totalAmount * 0.6);
        } else if (i % 6 === 2) {
          paymentStatus = 'unpaid';
          amountPaid = 0;
        }

        const balanceDue = round2Decimals(totalAmount - amountPaid);

        const workRecord = new WorkRecord({
          booking: booking._id,
          customer: customer._id,
          tractorOwner: owner._id,
          service: service._id,
          serviceSnapshot: booking.serviceSnapshot,
          tractor: tractor._id,
          fieldLocation: booking.fieldLocation,
          actualQuantity,
          actualAcres,
          workDate: bookingDate,
          startTime: '08:00 AM',
          endTime: '12:00 PM',
          workingHours: 4,
          dieselUsedLiters: Math.floor(Math.random() * 8) + 12,
          finalCharge,
          discount,
          discountReason: discount ? 'Regular customer discount' : '',
          extraCharges,
          extraChargesReason: extraCharges ? 'Rocky terrain extra effort' : '',
          totalAmount,
          amountPaid,
          balanceDue,
          paymentStatus,
          operatorName: tractor.currentOperatorName,
          completionNotes: 'Field work completed with good soil pulverization.',
          completedBy: owner._id
        });

        await workRecord.save();
        workRecords.push(workRecord);

        if (amountPaid > 0) {
          const method = i % 2 === 0 ? 'cash' : 'upi';
          const payment = new Payment({
            workRecord: workRecord._id,
            booking: booking._id,
            customer: customer._id,
            tractorOwner: owner._id,
            amount: amountPaid,
            method,
            status: 'paid',
            upiTransactionId: method === 'upi' ? `UPI${Date.now()}${i}` : '',
            paidAt: bookingDate,
            notes: method === 'cash' ? 'Collected cash in field' : 'UPI transfer verified',
            recordedBy: owner._id
          });
          await payment.save();
          payments.push(payment);
        }
      }
    }

    // 7. Seed Operational Expenses for Each Owner
    console.log('⛽ Seeding Fleet Expenses for Owners...');
    const owner1Expenses = [
      { category: 'diesel', amount: 3500, description: '38L Diesel Indian Oil Bilkisganj', tractor: owner1Tractors[0]._id },
      { category: 'maintenance', amount: 2200, description: 'Engine oil 15W-40 & hydraulic filter', tractor: owner1Tractors[1]._id },
      { category: 'repair', amount: 4500, description: 'Rotavator blade replacement (set of 36)', tractor: owner1Tractors[0]._id }
    ];

    for (const exp of owner1Expenses) {
      await Expense.create({
        ...exp,
        tractorOwner: owner1._id,
        paymentMethod: 'cash',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        recordedBy: owner1._id,
        vendor: 'Bilkisganj Diesel Depot'
      });
    }

    const owner2Expenses = [
      { category: 'diesel', amount: 4200, description: '45L Diesel HP Pump Shyampur', tractor: owner2Tractors[0]._id },
      { category: 'spare_parts', amount: 1800, description: 'Seed drill furrow openers set', tractor: owner2Tractors[0]._id },
      { category: 'labour', amount: 5000, description: 'Operator weekly payout for haulage', tractor: owner2Tractors[1]._id }
    ];

    for (const exp of owner2Expenses) {
      await Expense.create({
        ...exp,
        tractorOwner: owner2._id,
        paymentMethod: 'upi',
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        recordedBy: owner2._id,
        vendor: 'Shyampur Krishi Kendra'
      });
    }

    console.log('\n=============================================================');
    console.log('✅ MULTI-OWNER SEEDING COMPLETE!');
    console.log('=============================================================');
    console.log(`👑 Platform Admin:`);
    console.log(`   Mobile   : ${config.admin.mobile} / Password: ${config.admin.password}`);
    console.log(`\n🚜 Tractor Owners:`);
    console.log(`   Owner 1  : 9826111111 / Password: ${ownerPassword} (Rajesh Patidar - Patidar Krishi Yantra Seva) [APPROVED]`);
    console.log(`   Owner 2  : 9826222222 / Password: ${ownerPassword} (Suresh Kumar Mewada - Mewada Agro & Tractor Services) [APPROVED]`);
    console.log(`   Owner 3  : 9826333333 / Password: ${ownerPassword} (Dharmendra Choudhary - Narmada Valley) [PENDING APPROVAL]`);
    console.log(`\n👨‍🌾 Farmers (Customers - 10 total):`);
    console.log(`   Farmer 1 : 9826011111 / Password: ${defaultCustomerPassword} (Shivraj Singh)`);
    console.log(`   Farmer 2 : 9826022222 / Password: ${defaultCustomerPassword} (Jagdish Meena)`);
    console.log(`=============================================================\n`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Multi-Owner Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
