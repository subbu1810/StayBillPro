export const APPLIANCE_CATEGORIES = [
  'Fridge',
  'TV',
  'AC',
  'Mixer Grinder',
  'Inverter Battery',
  'Washing Machine',
  'Microwave',
  'Water Heater'
];

export const initialAppliances = [
  {
    id: '1',
    type: 'Fridge',
    brand: 'Samsung',
    modelNumber: 'RF28R7351SR',
    purchaseDate: '2021-03-15',
    warrantyExpiry: '2024-03-15'
  },
  {
    id: '2',
    type: 'TV',
    brand: 'LG',
    modelNumber: 'OLED55C1',
    purchaseDate: '2020-11-20',
    warrantyExpiry: '2023-11-20'
  },
  {
    id: '3',
    type: 'AC',
    brand: 'Daikin',
    modelNumber: 'FTKF50TV',
    purchaseDate: '2022-05-10',
    warrantyExpiry: '2027-05-10'
  },
  {
    id: '4',
    type: 'Washing Machine',
    brand: 'Whirlpool',
    modelNumber: 'WTW5000DW',
    purchaseDate: '2021-08-22',
    warrantyExpiry: '2024-08-22'
  },
  {
    id: '5',
    type: 'Microwave',
    brand: 'Panasonic',
    modelNumber: 'NN-SN966S',
    purchaseDate: '2023-01-10',
    warrantyExpiry: '2026-01-10'
  },
  {
    id: '6',
    type: 'Mixer Grinder',
    brand: 'Philips',
    modelNumber: 'HL7756',
    purchaseDate: '2022-09-15',
    warrantyExpiry: '2024-09-15'
  }
];

export const initialServiceRequests = [
  {
    id: '1',
    applianceType: 'Fridge',
    customerName: 'John Smith',
    phone: '555-0101',
    address: '123 Main St, Apt 4B',
    issueDescription: 'Fridge not cooling properly, making unusual noises',
    date: '2024-12-04',
    status: 'Pending'
  },
  {
    id: '2',
    applianceType: 'TV',
    customerName: 'Sarah Johnson',
    phone: '555-0102',
    address: '456 Oak Ave, Suite 12',
    issueDescription: 'Screen flickering and no sound output',
    date: '2024-12-03',
    status: 'In Progress'
  },
  {
    id: '3',
    applianceType: 'AC',
    customerName: 'Michael Brown',
    phone: '555-0103',
    address: '789 Pine Rd, Floor 3',
    issueDescription: 'Not cooling efficiently, high electricity consumption',
    date: '2024-12-02',
    status: 'In Progress'
  },
  {
    id: '4',
    applianceType: 'Washing Machine',
    customerName: 'Emma Davis',
    phone: '555-0104',
    address: '321 Elm St, Building A',
    issueDescription: 'Excessive vibration during spin cycle',
    date: '2024-12-01',
    status: 'Completed'
  },
  {
    id: '5',
    applianceType: 'Microwave',
    customerName: 'David Wilson',
    phone: '555-0105',
    address: '654 Maple Dr, Unit 5',
    issueDescription: 'Touchpad not responding, timer malfunction',
    date: '2024-11-30',
    status: 'Completed'
  },
  {
    id: '6',
    applianceType: 'TV',
    customerName: 'Lisa Anderson',
    phone: '555-0106',
    address: '987 Cedar Ln, Apt 8C',
    issueDescription: 'HDMI ports not working properly',
    date: '2024-11-29',
    status: 'Completed'
  },
  {
    id: '7',
    applianceType: 'AC',
    customerName: 'James Taylor',
    phone: '555-0107',
    address: '147 Birch Way, House 22',
    issueDescription: 'Water leakage from indoor unit',
    date: '2024-12-05',
    status: 'Pending'
  },
  {
    id: '8',
    applianceType: 'Fridge',
    customerName: 'Patricia Martinez',
    phone: '555-0108',
    address: '258 Spruce Ct, Floor 2',
    issueDescription: 'Ice maker not functioning, temperature inconsistent',
    date: '2024-12-04',
    status: 'In Progress'
  }
];
