
import React from 'react';
import { TechCategory, Customer, Expo, User } from './types';

export const TECH_LIST = Object.values(TechCategory);

export const DISCOVERY_KEYWORDS = [
  "Mechanical Workshop",
  "Fabrication Unit",
  "CNC Machine Shop",
  "Manufacturing Company",
  "Industrial Supplier",
  "Tool and Die makers",
  "Injection Molding"
];

export const INDUSTRIAL_HUBS: Record<string, Record<string, Record<string, [number, number]>>> = {
  'Punjab': {
    'Mohali': {
      'Phase-8': [30.7061, 76.6975],
      'Phase-7': [30.7107, 76.7115],
      'Phase-9': [30.6865, 76.7214]
    }
  },
  'Haryana': {
    'Gurugram': {
      'Manesar': [28.3515, 76.9427],
      'Udyog Vihar': [28.5024, 77.0818]
    }
  },
  'Gujarat': {
    'Ahmedabad': {
      'Sanand GIDC': [22.9863, 72.3785],
      'Naroda IE': [23.0768, 72.6586]
    },
    'Rajkot': {
      'Aji Vasahat': [22.2858, 70.8242],
      'Metoda GIDC': [22.2570, 70.6830]
    }
  }
};

/**
 * System Administrators
 */
export const SYSTEM_ADMINS: User[] = [
  { name: 'Mr. Bharat', role: 'Admin', avatar: 'https://picsum.photos/seed/bharat/64/64' },
  { name: 'Salil Anand', role: 'Admin', avatar: 'https://picsum.photos/seed/salil/64/64' },
];

/**
 * Marketing Team Members with enhanced personal details.
 */
export const MARKETING_TEAM = [
  {
    name: 'Shreeya Anand',
    role: 'Marketing Lead',
    avatar: 'https://picsum.photos/seed/shreeya/128/128',
    email: 'shreeya.anand@markeng.com',
    phone: '+91 98765 43210',
    bio: 'Specializes in additive manufacturing market penetration and B2B brand strategy.'
  },
  {
    name: 'Mr. Bharat',
    role: 'System Administrator',
    avatar: 'https://picsum.photos/seed/bharat/128/128',
    email: 'bharat.anand@markeng.com',
    phone: '+91 98765 43211',
    bio: 'Oversees organizational operations and strategic technological integrations.'
  },
  {
    name: 'Salil Anand',
    role: 'System Administrator',
    avatar: 'https://picsum.photos/seed/salil/128/128',
    email: 'salil.anand@markeng.com',
    phone: '+91 98765 43212',
    bio: 'Digital transformation expert focusing on sales automation and cloud infrastructure.'
  },
  {
    name: 'Rohit Verma',
    role: 'Growth Lead',
    avatar: 'https://picsum.photos/seed/rohit/128/128',
    email: 'rohit.verma@markeng.com',
    phone: '+91 98765 43213',
    bio: 'Driving customer acquisition and expansion in the Tier-1 automotive and aerospace sectors.'
  },
  {
    name: 'Shubham Kumar',
    role: 'Market Analyst',
    avatar: 'https://picsum.photos/seed/shubham/128/128',
    email: 'shubham.kumar@markeng.com',
    phone: '+91 98765 43214',
    bio: 'Deep-dives into manufacturing trends and pricing variance across Indian industrial clusters.'
  },
];

export const ZONES = ['All Zones', 'North', 'South', 'East', 'West', 'Central'];

/**
 * Master Registry: Indian States, UTs, Zones, and a comprehensive list of over 500 major cities.
 */
export const INDIA_GEO_DATA: Record<string, { zone: string; cities: string[]; coords: [number, number] }> = {
  'Punjab': {
    zone: 'North',
    cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Firozpur', 'Kapurthala', 'Sunam', 'Sangrur', 'Fazilka', 'Gurdaspur', 'Nabha', 'Tarn Taran', 'Zirakpur', 'Mansa'],
    coords: [31.1471, 75.3412]
  },
  'Haryana': {
    zone: 'North',
    cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Sirsa', 'Bhiwani', 'Bahadurgarh', 'Jind', 'Thanesar', 'Kaithal', 'Rewari', 'Palwal', 'Hansi', 'Narnaul', 'Fatehabad', 'Gohana', 'Mandi Dabwali', 'Charkhi Dadri', 'Shahbad', 'Pehowa', 'Ladwa'],
    coords: [29.0588, 76.0856]
  },
  'Himachal Pradesh': {
    zone: 'North',
    cities: ['Shimla', 'Solan', 'Baddi', 'Dharamshala', 'Mandi', 'Palampur', 'Nahan', 'Paonta Sahib', 'Una', 'Hamirpur', 'Kullu', 'Bilaspur', 'Chamba', 'Dalhousie', 'Manali'],
    coords: [31.1048, 77.1734]
  },
  'Delhi': {
    zone: 'North',
    cities: ['New Delhi', 'Delhi Cantonment', 'North Delhi', 'South Delhi', 'West Delhi', 'East Delhi', 'Dwarka', 'Rohini', 'Karol Bagh', 'Najafgarh', 'Narela', 'Pitampura', 'Saraswati Vihar', 'Shahdara', 'Yamuna Vihar'],
    coords: [28.6139, 77.2090]
  },
  'Jammu and Kashmir': {
    zone: 'North',
    cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua', 'Sopore', 'Samba', 'Udhampur', 'Reasi', 'Rajouri', 'Poonch', 'Doda', 'Bandipora', 'Kupwara'],
    coords: [33.7782, 76.5762]
  },
  'Uttarakhand': {
    zone: 'North',
    cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Pantnagar', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Srinagar', 'Pithoragarh', 'Ramnagar', 'Manglaur', 'Jaspur', 'Nainital', 'Mussoorie'],
    coords: [30.0668, 79.0193]
  },
  'Uttar Pradesh': {
    zone: 'North',
    cities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Mau', 'Hapur', 'Faizabad', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli', 'Orai', 'Sitapur', 'Bahraich', 'Modinagar', 'Unnao', 'Jaunpur', 'Lakhimpur', 'Hathras', 'Banda', 'Pilibhit', 'Greater Noida'],
    coords: [26.8467, 80.9462]
  },
  'Tamil Nadu': {
    zone: 'South',
    cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kancheepuram', 'Kumarapalayam', 'Karaikudi', 'Neyveli', 'Cuddalore', 'Kumbakonam', 'Pollachi', 'Rajapalayam', 'Gudiyatham', 'Pudukkottai', 'Vaniyambadi', 'Ambur', 'Nagapattinam', 'Tiruvannamalai', 'Namakkal', 'Krishnagiri', 'Mayiladuthurai'],
    coords: [11.1271, 78.6569]
  },
  'Karnataka': {
    zone: 'South',
    cities: ['Bengaluru', 'Hubballi-Dharwad', 'Mysuru', 'Kalaburagi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Raichur', 'Bidar', 'Hosapete', 'Gadag-Betageri', 'Hassan', 'Bhadravati', 'Chitradurga', 'Udupi', 'Kolar', 'Mandya', 'Chikkamagaluru', 'Gangavati', 'Bagalkot', 'Ranebennuru', 'Chamarajanagar', 'Sirsi', 'Karwar', 'Ramanagara', 'Yadgir', 'Koppal', 'Haveri'],
    coords: [15.3173, 75.7139]
  },
  'Kerala': {
    zone: 'South',
    cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Kannur', 'Kottayam', 'Manjeri', 'Thalassery', 'Ponnani', 'Vatakara', 'Kanhangad', 'Payyanur', 'Koyilandy', 'Neyyattinkara', 'Kayamkulam', 'Malappuram', 'Guruvayur', 'Kasargod', 'Changanassery', 'Punalur', 'Pathanamthitta', 'Attingal', 'Irinjalakuda', 'Chittur-Thathamangalam'],
    coords: [10.8505, 76.2711]
  },
  'Telangana': {
    zone: 'South',
    cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Siddipet', 'Kamareddy', 'Mancherial', 'Kothagudem', 'Jagtial', 'Nirmal', 'Wanaparthy', 'Bhongir', 'Vikarabad', 'Gajwel', 'Sangareddy', 'Medak'],
    coords: [18.1124, 79.0193]
  },
  'Andhra Pradesh': {
    zone: 'South',
    cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati', 'Kakinada', 'Kurnool', 'Rajamahendravaram', 'Kadapa', 'Anantapur', 'Vizianagaram', 'Eluru', 'Ongole', 'Nandyal', 'Machilipatnam', 'Adoni', 'Tenali', 'Chittoor', 'Hindupur', 'Proddatur', 'Bhimavaram', 'Madanapalle', 'Guntakal', 'Dharmavaram', 'Gudivada', 'Srikakulam', 'Narasaraopet', 'Tadipatri', 'Tadepalligudem', 'Chilakaluripet'],
    coords: [15.9129, 79.7400]
  },
  'Maharashtra': {
    zone: 'West',
    cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Pimpri-Chinchwad', 'Nashik', 'Kalyan-Dombivli', 'Vasai-Virar', 'Aurangabad', 'Navi Mumbai', 'Solapur', 'Mira-Bhayandar', 'Bhiwandi-Nizampur', 'Amravati', 'Nanded-Waghala', 'Kolhapur', 'Akola', 'Ulhasnagar', 'Sangli-Miraj-Kupwad', 'Jalgaon', 'Malegaon', 'Ahmednagar', 'Latur', 'Dhule', 'Ichalkaranji', 'Chandrapur', 'Parbhani', 'Satara', 'Beed', 'Yavatmal', 'Gondia', 'Ambernath', 'Achalpur', 'Osmanabad', 'Nandurbar', 'Wardha', 'Udgir', 'Hinganghat'],
    coords: [19.7515, 75.7139]
  },
  'Gujarat': {
    zone: 'West',
    cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Nadiad', 'Anand', 'Morbi', 'Mehsana', 'Surendranagar', 'Bharuch', 'Vapi', 'Navsari', 'Veraval', 'Porbandar', 'Godhra', 'Bhuj', 'Ankleshwar', 'Botad', 'Patan', 'Palanpur', 'Jetpur', 'Valsad', 'Kalol', 'Gondal', 'Amreli', 'Deesa', 'Mundra', 'Kadi', 'Visnagar', 'Himmatnagar'],
    coords: [22.2587, 71.1924]
  },
  'Rajasthan': {
    zone: 'West',
    cities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Beawar', 'Tonk', 'Hanumangarh', 'Kishangarh', 'Bhiwadi', 'Jhunjhunu', 'Sawai Madhopur', 'Churu', 'Gangapur City', 'Hindaun', 'Banswara', 'Nagaur', 'Makrana', 'Sujangarh', 'Barmer', 'Chittorgarh', 'Dholpur', 'Sardarshahar', 'Jhalawar', 'Sirohi'],
    coords: [27.0238, 74.2179]
  },
  'Goa': {
    zone: 'West',
    cities: ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Mormugao'],
    coords: [15.2993, 74.1240]
  },
  'West Bengal': {
    zone: 'East',
    cities: ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'English Bazar', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Haldia', 'Jalpaiguri', 'Balurghat', 'Basirhat', 'Bankura', 'Chakdaha', 'Darjeeling', 'Alipurduar', 'Purulia', 'Jangipur', 'Bangaon', 'Krishnanagar', 'Madhyamgram', 'Barasat', 'Rajpur Sonarpur', 'South Dum Dum', 'Gopalpur', 'Bhatpara', 'Panihati', 'Kamarhati', 'Kulti', 'Baranagar', 'Serampore'],
    coords: [22.9868, 87.8550]
  },
  'Odisha': {
    zone: 'East',
    cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Anugul', 'Bargarh', 'Kendujhar', 'Bhawanipatna', 'Jatni', 'Dhenkanal', 'Rayagada', 'Paradip', 'Sunabeda', 'Koraput', 'Talcher'],
    coords: [20.9517, 85.0985]
  },
  'Bihar': {
    zone: 'East',
    cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chapra', 'Saharsa', 'Sasaram', 'Hajipur', 'Dehri', 'Bettiah', 'Motihari', 'Bagaha', 'Siwan', 'Kishanganj', 'Jamalpur', 'Buxar', 'Jehanabad', 'Aurangabad', 'Lakhisarai', 'Nawada', 'Jamui', 'Madhubani', 'Samastipur', 'Sitamarhi'],
    coords: [25.0961, 85.3131]
  },
  'Jharkhand': {
    zone: 'East',
    cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Chas', 'Adityapur', 'Gumla', 'Dumka', 'Chaibasa', 'Ghatshila', 'Jhumri Telaiya', 'Sahibganj', 'Pakur'],
    coords: [23.6102, 85.2799]
  },
  'Madhya Pradesh': {
    zone: 'Central',
    cities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Chhatarpur', 'Damoh', 'Mandsaur', 'Khargone', 'Neemuch', 'Pithampur', 'Hoshangabad', 'Itarsi', 'Sehore', 'Betul', 'Seoni', 'Datia', 'Nagda'],
    coords: [22.9734, 78.6569]
  },
  'Chhattisgarh': {
    zone: 'Central',
    cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Ambikapur', 'Dhamtari', 'Mahasamund', 'Champa', 'Bhilai Charoda', 'Raigarh', 'Tilda Newra', 'Mungeli', 'Manendragarh', 'Kanker', 'Kondagaon'],
    coords: [21.2787, 81.8661]
  }
};

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Bharat Aerospace Ltd.',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    annualTurnover: 120000000,
    projectTurnover: 45000000,
    industry: 'Aerospace',
    contacts: [
      { id: 'c1', name: 'Rajesh Iyer', designation: 'Head of Procurement', email: 'r.iyer@bharataero.in', phone: '+91 80 4567 8901' }
    ],
    pricingHistory: [
      { id: 'p1', customerId: '1', tech: TechCategory.SLS_PA2200, rate: 75, unit: 'gram', date: '2024-01-15' }
    ],
    lastModifiedBy: 'Salil Anand',
    updatedAt: '2024-03-20 10:30 AM'
  },
  {
    id: '2',
    name: 'Tata Motors (Advanced Engineering)',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    annualTurnover: 250000000,
    projectTurnover: 80000000,
    industry: 'Automotive',
    contacts: [
      { id: 'c3', name: 'Sandeep Patil', designation: 'Supply Chain Mgr', email: 's.patil@tatamotors.com', phone: '+91 20 5555 0199' }
    ],
    pricingHistory: [
      { id: 'p3', customerId: '2', tech: TechCategory.MJF_PA12, rate: 65, unit: 'gram', date: '2024-03-01' }
    ],
    lastModifiedBy: 'Mr. Bharat',
    updatedAt: '2024-03-21 02:15 PM'
  }
];

export const MOCK_EXPOS: Expo[] = [
  { id: 'e1', name: 'AM Expo India 2024', date: '2024-09-12', location: 'Mumbai, India', industry: 'Additive Manufacturing', region: 'India', link: 'https://amexpoindia.com' },
  { id: 'e2', name: 'IMTEX 2025', date: '2025-01-23', location: 'Bengaluru, India', industry: 'Machine Tools & Manufacturing', region: 'India', link: 'https://imtex.in' }
];
