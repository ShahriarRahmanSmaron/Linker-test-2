import { Fabric, FAQItem, Step, Testimonial, ComparisonRow, PricingTier, ManufacturerFabric } from './types';

export const MOCK_FABRICS: Fabric[] = [
  {
    id: 'f1',
    name: 'Organic Cotton Pique',
    fabrication: 'Pique',
    gsm: 220,
    composition: '100% Organic Cotton',
    supplier: 'Masco Knits',
    color: '#2563EB',
    badges: ['GOTS', 'BCI'],
    mockupCategories: ['Polo', 'Tee'],
    type: 'Natural',
    price: '$4.50/kg',
    moq: '500kg',
    leadTime: '4 weeks'
  },
  {
    id: 'f2',
    name: 'Heavyweight Fleece',
    fabrication: 'Fleece',
    gsm: 340,
    composition: '80% Cotton / 20% Poly',
    supplier: 'TexVision',
    color: '#6B7280',
    badges: ['Oeko-Tex'],
    mockupCategories: ['Hoodie', 'Sweatpant'],
    type: 'Blend',
    price: '$5.20/kg',
    moq: '800kg',
    leadTime: '5 weeks'
  },
  {
    id: 'f3',
    name: 'Slub Jersey Vintage',
    fabrication: 'Single Jersey',
    gsm: 160,
    composition: '100% Cotton',
    supplier: 'NatureThreads',
    color: '#22C55E',
    badges: ['BCI'],
    mockupCategories: ['Tee', 'Tank'],
    type: 'Natural',
    price: '$3.80/kg',
    moq: '300kg',
    leadTime: '3 weeks'
  },
  {
    id: 'f4',
    name: 'Performance Mesh',
    fabrication: 'Mesh',
    gsm: 140,
    composition: '95% Recycled Poly / 5% Elastane',
    supplier: 'ActiveTech',
    color: '#F43F5E',
    badges: ['GRS', 'BlueSign'],
    mockupCategories: ['Sport Vest'],
    type: 'Synthetic',
    price: '$6.10/kg',
    moq: '1000kg',
    leadTime: '6 weeks'
  },
  {
    id: 'f5',
    name: 'French Terry Loopback',
    fabrication: 'Terry',
    gsm: 280,
    composition: '100% Cotton',
    supplier: 'Masco Knits',
    color: '#3B82F6',
    badges: ['BCI'],
    mockupCategories: ['Sweatshirt', 'Joggers'],
    type: 'Natural',
    price: '$4.90/kg',
    moq: '600kg',
    leadTime: '4 weeks'
  },
  {
    id: 'f6',
    name: 'Interlock Double Knit',
    fabrication: 'Interlock',
    gsm: 240,
    composition: '60% Cotton / 40% Poly',
    supplier: 'GlobalTex',
    color: '#10B981',
    badges: [],
    mockupCategories: ['Polo', 'Jacket'],
    type: 'Blend',
    price: '$4.20/kg',
    moq: '1200kg',
    leadTime: '5 weeks'
  },
  {
    id: 'f7',
    name: 'Rib Knit 2x2',
    fabrication: 'Rib',
    gsm: 300,
    composition: '95% Cotton / 5% Spandex',
    supplier: 'Elasticity Co',
    color: '#8B5CF6',
    badges: ['Oeko-Tex'],
    mockupCategories: ['Cuffs', 'Tops'],
    type: 'Blend',
    price: '$5.50/kg',
    moq: '200kg',
    leadTime: '2 weeks'
  },
  {
    id: 'f8',
    name: 'Bamboo Spandex Jersey',
    fabrication: 'Single Jersey',
    gsm: 180,
    composition: '95% Bamboo / 5% Spandex',
    supplier: 'EcoKnits',
    color: '#EC4899',
    badges: ['FSC', 'Oeko-Tex'],
    mockupCategories: ['Tee', 'Intimates'],
    type: 'Natural',
    price: '$7.00/kg',
    moq: '400kg',
    leadTime: '6 weeks'
  },
  {
    id: 'f9',
    name: 'Polar Fleece Anti-Pill',
    fabrication: 'Fleece',
    gsm: 260,
    composition: '100% Polyester',
    supplier: 'TexVision',
    color: '#F59E0B',
    badges: [],
    mockupCategories: ['Jacket', 'Blanket'],
    type: 'Synthetic',
    price: '$3.50/kg',
    moq: '1500kg',
    leadTime: '4 weeks'
  },
  {
    id: 'f10',
    name: 'Waffle Thermal',
    fabrication: 'Thermal',
    gsm: 210,
    composition: '60% Cotton / 40% Poly',
    supplier: 'WinterWarm',
    color: '#6366F1',
    badges: [],
    mockupCategories: ['Henley', 'Sleepwear'],
    type: 'Blend',
    price: '$4.80/kg',
    moq: '800kg',
    leadTime: '5 weeks'
  },
  {
    id: 'f11',
    name: 'CoolMax Active',
    fabrication: 'Interlock',
    gsm: 150,
    composition: '100% Polyester',
    supplier: 'ActiveTech',
    color: '#0EA5E9',
    badges: ['BlueSign'],
    mockupCategories: ['Sport Tee'],
    type: 'Synthetic',
    price: '$5.80/kg',
    moq: '1000kg',
    leadTime: '6 weeks'
  },
  {
    id: 'f12',
    name: 'Modal Jersey Soft',
    fabrication: 'Single Jersey',
    gsm: 140,
    composition: '100% Modal',
    supplier: 'LuxuryKnits',
    color: '#D946EF',
    badges: [],
    mockupCategories: ['Dress', 'Tee'],
    type: 'Natural',
    price: '$8.50/kg',
    moq: '300kg',
    leadTime: '5 weeks'
  }
];

export const INITIAL_MANUFACTURER_DATA: ManufacturerFabric[] = [
  {
    id: 'm1',
    fabricCode: 'MK-2024-001',
    fabricName: 'Premium Organic Cotton Pique',
    fabrication: 'Pique',
    fabricType: '100% Cotton',
    gsm: 220,
    composition: '100% Organic Cotton',
    category: ['Men', 'Women'],
    season: 'All Season',
    certifications: ['GOTS', 'BCI'],
    minOrderQty: 500,
    leadTime: 30,
    priceRange: '4.50 - 5.00 USD',
    colorways: 'Navy, White, Black, Heather Grey',
    notes: 'Bio-wash finish available.',
    swatchImageUrl: '', // Placeholder
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm2',
    fabricCode: 'MK-2024-005',
    fabricName: 'Soft Touch French Terry',
    fabrication: 'Terry',
    fabricType: 'CVC',
    gsm: 280,
    composition: '60% Cotton / 40% Polyester',
    category: ['Unisex', 'Kids'],
    season: 'Fall/Winter',
    certifications: ['OEKO-TEX'],
    minOrderQty: 800,
    leadTime: 45,
    priceRange: '3.80 - 4.20 USD',
    colorways: 'Melange, Solid Colors',
    notes: 'Loopback interior, soft handfeel.',
    swatchImageUrl: '', // Placeholder
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm3',
    fabricCode: 'MK-2024-012',
    fabricName: 'Performance Active Mesh',
    fabrication: 'Mesh',
    fabricType: 'Poly Spandex',
    gsm: 140,
    composition: '92% Polyester / 8% Spandex',
    category: ['Men', 'Women'],
    season: 'Spring/Summer',
    certifications: ['GRS'],
    minOrderQty: 1000,
    leadTime: 40,
    priceRange: '5.50 - 6.00 USD',
    colorways: 'Neon Green, Black, Electric Blue',
    notes: 'Wicking finish, 4-way stretch.',
    swatchImageUrl: '', // Placeholder
    isActive: false, // Example of inactive
    createdAt: new Date().toISOString()
  }
];

export const BUYER_STEPS: Step[] = [
  {
    id: 1,
    title: 'Search & Discover',
    description: 'Filter fabrics by style, composition, or GSM from verified global mills.',
    iconName: 'Search'
  },
  {
    id: 2,
    title: 'Preview Mockups',
    description: 'See instant 2D garment applications on Men, Women, and Kids silhouettes.',
    iconName: 'Shirt'
  },
  {
    id: 3,
    title: 'Select & Save',
    description: 'Add fabrics to your cart or auto-generate moodboards for your team.',
    iconName: 'LayoutTemplate'
  }
];

export const MANUFACTURER_STEPS: Step[] = [
  {
    id: 1,
    title: 'Login & Upload',
    description: 'Upload fabric specs, images, and certifications in minutes.',
    iconName: 'Upload'
  },
  {
    id: 2,
    title: 'Auto-Mockups',
    description: 'Our engine automatically creates garment visuals for every fabric you list.',
    iconName: 'Zap'
  },
  {
    id: 3,
    title: 'Get Discovered',
    description: 'Your collection becomes instantly searchable by global buyers.',
    iconName: 'Globe'
  }
];

export const COMPARISON_DATA: ComparisonRow[] = [
  { feature: "Fabric Visualization", traditional: "Static photos", platform: "Dynamic garment mockups" },
  { feature: "Moodboard Creation", traditional: "Manual & time-consuming", platform: "Auto-generated in seconds" },
  { feature: "Collaboration", traditional: "Email chaos", platform: "Centralized digital workspace" },
  { feature: "Buyer Reach", traditional: "Limited", platform: "Global exposure" },
  { feature: "Feedback & Data", traditional: "None", platform: "Measurable engagement" }
];

export const PRICING_TIERS: PricingTier[] = [
  {
    title: "For Buyers",
    variant: 'buyer',
    points: [
      { text: "Free to browse and build moodboards" },
      { text: "Access exclusive knit collections" },
      { text: "Connect directly with manufacturers" }
    ],
    cta: "Sign Up as Buyer"
  },
  {
    title: "For Manufacturers",
    variant: 'manufacturer',
    points: [
      { text: "Upload unlimited fabrics with instant mockups" },
      { text: "Get discovered by global fashion buyers" },
      { text: "Track engagement analytics" }
    ],
    cta: "Register as Manufacturer"
  }
];

export const VALUE_PROP_HIGHLIGHTS = [
  "Instant Mockup Visualization",
  "Smart Search & Filter by Fabrication",
  "Automated Moodboard Builder",
  "Verified Manufacturers Database"
];

export const FAQS: FAQItem[] = [
  {
    question: 'Do I need to install anything?',
    answer: 'No. LinkER is fully browser-based and optimized for laptop, desktop, and tablet usage.'
  },
  {
    question: 'Can I export moodboards and techpacks?',
    answer: 'Yes. You can export moodboards as high-res PDFs or PNGs, and techpacks as standard Excel or PDF files.'
  },
  {
    question: 'Can multiple team members collaborate?',
    answer: 'Absolutely. Team-based access allows buyers, designers, and merchandisers to view the same boards and fabric lists.'
  },
  {
    question: 'Is this only for knits?',
    answer: 'Currently, our visualization engine is optimized for knit structures, but we are expanding to wovens in Q4.'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote: "LinkER cut our sourcing time from 6 weeks to 3 days. The techpack auto-generation alone saved us hundreds of hours per season.",
    author: "Emma Richardson",
    role: "Senior Fabric Buyer",
    company: "Global Fast Fashion Brand",
    rating: 5,
    initials: "ER"
  },
  {
    id: 't2',
    quote: "The ability to see fabric applied to 3D garment mockups before ordering samples changed our entire workflow. No more guessing games.",
    author: "Marcus Chen",
    role: "Head of Sourcing",
    company: "Premium Sportswear Label",
    rating: 5,
    initials: "MC"
  },
  {
    id: 't3',
    quote: "We found sustainable suppliers we never knew existed. LinkER's filters for certifications and transparency data are unmatched.",
    author: "Sofia Martinez",
    role: "Sustainability Manager",
    company: "European Fashion House",
    rating: 5,
    initials: "SM"
  }
];