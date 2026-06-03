export const products = [
	{
		id: 1,
		category: 'AC',
		brand: 'LG',
		models: ['1.0T', '1.5T', '2.0T'],
		problems: ['Not Cooling', 'Water Leak', 'Strange Noise', 'Not Powering On'],
	},
	{
		id: 2,
		category: 'AC',
		brand: 'Samsung',
		models: ['1.0T', '1.5T', '2.0T'],
		problems: ['Not Cooling', 'Water Leak', 'Strange Noise', 'Not Powering On'],
	},
	{
		id: 3,
		category: 'Fridge',
		brand: 'Samsung',
		models: ['Single Door', 'Double Door', 'Side-by-Side'],
		problems: ['Not Cooling', 'Water Leak', 'Ice Formation', 'Compressor Noise'],
	},
	{
		id: 4,
		category: 'Fridge',
		brand: 'LG',
		models: ['Single Door', 'Double Door', 'Side-by-Side'],
		problems: ['Not Cooling', 'Water Leak', 'Ice Formation', 'Compressor Noise'],
	},
	{
		id: 5,
		category: 'TV',
		brand: 'Sony',
		models: ['32 Inch', '43 Inch', '55 Inch', '65 Inch'],
		problems: ['No Picture', 'No Sound', 'Screen Flickering', 'Remote Not Working'],
	},
	{
		id: 6,
		category: 'TV',
		brand: 'Samsung',
		models: ['32 Inch', '43 Inch', '55 Inch', '65 Inch'],
		problems: ['No Picture', 'No Sound', 'Screen Flickering', 'Remote Not Working'],
	},
	{
		id: 7,
		category: 'Mixer Grinder',
		brand: 'Philips',
		models: ['Basic', 'Premium', 'Deluxe'],
		problems: ['Motor Not Working', 'Grinding Issue', 'Overheating', 'Leakage'],
	},
	{
		id: 8,
		category: 'Inverter',
		brand: 'Su-Kam',
		models: ['1kVA', '2kVA', '5kVA'],
		problems: ['Not Charging', 'Display Issue', 'Battery Connection', 'Power Output Issue'],
	},
	{
		id: 9,
		category: 'Battery',
		brand: 'Exide',
		models: ['12V 50Ah', '12V 100Ah', '24V 100Ah'],
		problems: ['Not Charging', 'Low Backup', 'Terminal Corrosion', 'Physical Damage'],
	},
];

export const estimatedServiceTimes = {
	AC: '2-3 hours',
	Fridge: '1-2 hours',
	TV: '1-3 hours',
	'Mixer Grinder': '30-60 minutes',
	Inverter: '1-2 hours',
	Battery: '30-45 minutes',
};
