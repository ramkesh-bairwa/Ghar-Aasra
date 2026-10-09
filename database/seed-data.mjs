// Demo content loaded into MySQL by database/seed.mjs (`npm run db:seed`).
// The site never reads this file directly — every page reads from the
// database through lib/queries.js, so edit content in /admin, not here.

export const amenitiesList = ["Roof terrace", "Parking", "Swimming pool", "Pet friendly", "Home office", "Concierge", "Garden"];

export const locations = [
  { id: 1, slug: "amsterdam", city: "Amsterdam", country: "Netherlands", propertiesCount: 214, image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?q=80&w=800&auto=format&fit=crop", description: "Canal-side apartments and converted warehouses across the city's historic ring." },
  { id: 2, slug: "copenhagen", city: "Copenhagen", country: "Denmark", propertiesCount: 342, image: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?q=80&w=800&auto=format&fit=crop", description: "Scandinavian design homes from Nørrebro's courtyards to the harbourfront." },
  { id: 3, slug: "london", city: "London", country: "United Kingdom", propertiesCount: 486, image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", description: "Everything from Zone 1 period conversions to new-build riverside towers." },
  { id: 4, slug: "new-york-city", city: "New York City", country: "United States", propertiesCount: 610, image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop", description: "Manhattan condos, Brooklyn brownstones, and everything between." },
  { id: 5, slug: "paris", city: "Paris", country: "France", propertiesCount: 298, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop", description: "Haussmannian apartments and Left Bank pieds-à-terre." },
  { id: 6, slug: "munich", city: "Munich", country: "Germany", propertiesCount: 227, image: "https://images.unsplash.com/photo-1595867818082-083862f3d630?q=80&w=800&auto=format&fit=crop", description: "Family houses and new villas on the edge of the Bavarian countryside." },
];

export const developers = [
  { id: 1, slug: "meridian-group", companyName: "Meridian Group", logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=200&auto=format&fit=crop", foundedYear: 1998, website: "meridiangroup.example", description: "A 25-year developer known for waterfront residential projects across Northern Europe, with a focus on long-term neighbourhood planning rather than single towers.", projectsCount: 14 },
  { id: 2, slug: "northfield-developments", companyName: "Northfield Developments", logo: "https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?q=80&w=200&auto=format&fit=crop", foundedYear: 2006, website: "northfielddev.example", description: "Mid-size developer specialising in low-rise, courtyard-style housing built around shared green space.", projectsCount: 8 },
  { id: 3, slug: "aldergate-estates", companyName: "Aldergate Estates", logo: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=200&auto=format&fit=crop", foundedYear: 2011, website: "aldergateestates.example", description: "London-focused developer of mixed-use towers combining residential, retail, and public riverside walkways.", projectsCount: 6 },
];

export const agents = [
  { id: 1, slug: "jessica-williams", name: "Jessica Williams", phone: "+1 949 555 8520", email: "jessica.williams9@example.com", whatsapp: "+19495558520", agencyName: "Flex Home Realty", bio: "Jessica has closed over 180 residential sales across New York and Connecticut, with a focus on first-time buyers navigating competitive markets.", yearsExperience: 9, rating: 4.9, reviewCount: 132, image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=500&auto=format&fit=crop", propertiesCount: 6 },
  { id: 2, slug: "amanda-smith", name: "Amanda Smith", phone: "+1 510 555 1357", email: "amanda.smith7@example.com", whatsapp: "+15105551357", agencyName: "Flex Home Realty", bio: "Amanda specialises in relocation clients moving into the Bay Area, handling everything from school-district research to closing paperwork.", yearsExperience: 6, rating: 4.8, reviewCount: 97, image: "https://images.unsplash.com/photo-1615813967515-e1838c1c5116?q=80&w=500&auto=format&fit=crop", propertiesCount: 5 },
  { id: 3, slug: "lisa-wilson", name: "Lisa Wilson", phone: "+1 646 555 3456", email: "lisa.wilson5@example.com", whatsapp: "+16465553456", agencyName: "Flex Home Realty", bio: "Lisa focuses on luxury condos and new developments in Manhattan, with strong relationships across the city's major developers.", yearsExperience: 11, rating: 5.0, reviewCount: 204, image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=500&auto=format&fit=crop", propertiesCount: 6 },
  { id: 4, slug: "jennifer-rodriguez", name: "Jennifer Rodriguez", phone: "+1 718 555 4321", email: "jennifer.rodriguez3@example.com", whatsapp: "+17185554321", agencyName: "Flex Home Realty", bio: "Jennifer works primarily with landlords and renters across Brooklyn and Queens, known for fast turnaround on vacant units.", yearsExperience: 7, rating: 4.7, reviewCount: 88, image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=500&auto=format&fit=crop", propertiesCount: 5 },
  { id: 5, slug: "daniel-kim", name: "Daniel Kim", phone: "+45 20 555 9910", email: "daniel.kim@example.com", whatsapp: "+4520555991", agencyName: "Flex Home Realty", bio: "Daniel has represented buyers and developers across Copenhagen for a decade, with deep knowledge of Nordic building standards.", yearsExperience: 10, rating: 4.9, reviewCount: 156, image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500&auto=format&fit=crop", propertiesCount: 7 },
  { id: 6, slug: "sophie-bernard", name: "Sophie Bernard", phone: "+33 6 55 12 34 56", email: "sophie.bernard@example.com", whatsapp: "+33655123456", agencyName: "Flex Home Realty", bio: "Sophie is based in Paris and specialises in heritage apartments requiring renovation guidance alongside the sale.", yearsExperience: 8, rating: 4.8, reviewCount: 112, image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=500&auto=format&fit=crop", propertiesCount: 4 },
];

export const projects = [
  {
    id: 1, slug: "harbor-point-residences", name: "Harbor Point Residences",
    developerId: 1, locationId: 2, status: "under_construction", handover: "Q2 2027",
    startingPrice: "$412,000", totalUnits: 186,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
    ],
    description: "A 186-unit waterfront development on Copenhagen's inner harbour, combining one- to four-bedroom apartments with ground-floor retail and a public boardwalk. Construction began in 2025 with phased handovers starting Q2 2027.",
    amenities: ["Private marina access", "Rooftop terrace", "Underground parking", "24/7 concierge", "Resident gym"],
  },
  {
    id: 2, slug: "the-willow-quarter", name: "The Willow Quarter",
    developerId: 2, locationId: 6, status: "selling", handover: "Q4 2026",
    startingPrice: "$389,500", totalUnits: 94,
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=1000&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop",
    ],
    description: "94 low-rise family homes arranged around three shared courtyards on the edge of Munich, built to Passivhaus energy standards with private gardens on ground-floor units.",
    amenities: ["Shared courtyard gardens", "Passivhaus energy rating", "EV charging", "Children's play area"],
  },
  {
    id: 3, slug: "riverline-towers", name: "Riverline Towers",
    developerId: 3, locationId: 3, status: "presale", handover: "Q1 2028",
    startingPrice: "$556,000", totalUnits: 240,
    image: "https://images.unsplash.com/photo-1499955085172-a104c9463ece?q=80&w=1000&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1499955085172-a104c9463ece?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?q=80&w=800&auto=format&fit=crop",
    ],
    description: "Twin riverside towers on London's South Bank with 240 residences above a new public promenade, retail units, and a resident wellness floor.",
    amenities: ["River-facing balconies", "Wellness floor & pool", "Co-working lounge", "Cinema room"],
  },
];

export const properties = [
  { id: 1, slug: "silverwood-villas", title: "Silverwood Villas", listingType: "sale", propertyType: "Apartment", price: "$934,200", priceValue: 934200, bedrooms: 8, bathrooms: 8, area: "420 m²", city: "New York City", locationSlug: "new-york-city", address: "148 Riverside Drive, New York City", agentId: 1, image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?q=80&w=900&auto=format&fit=crop", tag: "Selling", featured: true,
    description: "A light-filled apartment across the top two floors of a converted 1920s building, with private roof access and river views from every principal room.",
    features: ["Roof terrace", "River view", "Original hardwood floors", "Central air", "Assigned parking"] },
  { id: 2, slug: "evergreen-terrace", title: "Evergreen Terrace", listingType: "sale", propertyType: "Land", price: "$62,000", priceValue: 62000, bedrooms: 0, bathrooms: 0, area: "930 m²", city: "Copenhagen", locationSlug: "copenhagen", address: "Evergreen Lane, Copenhagen", agentId: 5, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=900&auto=format&fit=crop", tag: "Selling", featured: true,
    description: "Cleared building plot with planning permission in place for a single-family home, on a quiet lane ten minutes from the city centre.",
    features: ["Planning permission granted", "Road access", "Utilities at boundary"] },
  { id: 3, slug: "golden-gate-residences", title: "Golden Gate Residences", listingType: "sale", propertyType: "Villa", price: "$977,200", priceValue: 977200, bedrooms: 9, bathrooms: 3, area: "470 m²", city: "Munich", locationSlug: "munich", address: "22 Golden Gate Way, Munich", agentId: 2, image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=900&auto=format&fit=crop", tag: "Selling", featured: true,
    description: "A striking modern villa with a heated pool and floor-to-ceiling glazing across the ground floor living space.",
    features: ["Heated pool", "Smart home system", "Home cinema", "Triple garage"] },
  { id: 4, slug: "horizon-heights", title: "Horizon Heights", listingType: "sale", propertyType: "Villa", price: "$705,000", priceValue: 705000, bedrooms: 4, bathrooms: 3, area: "310 m²", city: "Copenhagen", locationSlug: "copenhagen", address: "9 Horizon Court, Copenhagen", agentId: 5, image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=900&auto=format&fit=crop", tag: "Selling", featured: false,
    description: "A recently renovated four-bedroom villa with a south-facing garden and a detached studio suitable for a home office.",
    features: ["South-facing garden", "Detached studio", "Underfloor heating"] },
  { id: 5, slug: "timberline-estates", title: "Timberline Estates", listingType: "sale", propertyType: "Villa", price: "$438,900", priceValue: 438900, bedrooms: 6, bathrooms: 2, area: "960 m²", city: "Copenhagen", locationSlug: "copenhagen", address: "5 Timberline Rd, Copenhagen", agentId: 5, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop", tag: "Selling", featured: true,
    description: "Set on a generous wooded plot, this six-bedroom estate combines a renovated main house with a separate guest cottage.",
    features: ["Guest cottage", "Wooded plot", "Wood-burning stove"] },
  { id: 6, slug: "elmwood-park", title: "Elmwood Park", listingType: "sale", propertyType: "Land", price: "$211,300", priceValue: 211300, bedrooms: 0, bathrooms: 0, area: "400 m²", city: "Munich", locationSlug: "munich", address: "Elmwood Park, Munich", agentId: 2, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=900&auto=format&fit=crop", tag: "Selling", featured: false,
    description: "A residential plot bordering Elmwood Park, zoned for a two-storey single-family home.", features: ["Park-adjacent", "Zoned residential"] },
  { id: 7, slug: "autumn-leaves", title: "Autumn Leaves", listingType: "sale", propertyType: "Villa", price: "$519,000", priceValue: 519000, bedrooms: 9, bathrooms: 6, area: "870 m²", city: "Amsterdam", locationSlug: "amsterdam", address: "14 Autumn Leaves Way, Amsterdam", agentId: 1, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=900&auto=format&fit=crop", tag: "Selling", featured: false,
    description: "A large family villa arranged over three floors, with a self-contained annex suitable for multigenerational living.",
    features: ["Self-contained annex", "Three floors", "Private driveway"] },
  { id: 8, slug: "pebble-creek", title: "Pebble Creek", listingType: "sale", propertyType: "House", price: "$598,700", priceValue: 598700, bedrooms: 3, bathrooms: 7, area: "50 m²", city: "Paris", locationSlug: "paris", address: "3 Pebble Creek Ln, Paris", agentId: 6, image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=900&auto=format&fit=crop", tag: "Selling", featured: false,
    description: "A compact, beautifully restored townhouse close to the Left Bank, with period detailing throughout.", features: ["Period detailing", "Restored throughout"] },
  { id: 9, slug: "sunset-ridge", title: "Sunset Ridge", listingType: "rent", propertyType: "House", price: "$1,430/mo", priceValue: 1430, bedrooms: 6, bathrooms: 2, area: "160 m²", city: "Copenhagen", locationSlug: "copenhagen", address: "18 Sunset Ridge, Copenhagen", agentId: 5, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=900&auto=format&fit=crop", tag: "Renting", featured: true,
    description: "A spacious rental house with a fenced garden, available for immediate move-in on a 12-month lease.", features: ["Fenced garden", "Unfurnished", "Pet friendly"] },
  { id: 10, slug: "crystal-lake-condos", title: "Crystal Lake Condos", listingType: "rent", propertyType: "Villa", price: "$1,038/mo", priceValue: 1038, bedrooms: 2, bathrooms: 9, area: "970 m²", city: "New York City", locationSlug: "new-york-city", address: "77 Crystal Lake Ave, New York City", agentId: 4, image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=900&auto=format&fit=crop", tag: "Renting", featured: true,
    description: "A bright two-bedroom condo with lake views and access to the building's shared amenities.", features: ["Lake view", "Shared gym", "Concierge"] },
  { id: 11, slug: "magnolia-manor", title: "Magnolia Manor", listingType: "rent", propertyType: "Condo", price: "$2,390/mo", priceValue: 2390, bedrooms: 6, bathrooms: 9, area: "830 m²", city: "Copenhagen", locationSlug: "copenhagen", address: "41 Magnolia St, Copenhagen", agentId: 5, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=900&auto=format&fit=crop", tag: "Renting", featured: true,
    description: "A grand rental property with mature gardens, available furnished or unfurnished.", features: ["Furnished option", "Mature gardens", "Staff quarters"] },
  { id: 12, slug: "seaside-villas", title: "Seaside Villas", listingType: "rent", propertyType: "Condo", price: "$1,600/mo", priceValue: 1600, bedrooms: 6, bathrooms: 5, area: "750 m²", city: "Munich", locationSlug: "munich", address: "6 Seaside Dr, Munich", agentId: 2, image: "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?q=80&w=900&auto=format&fit=crop", tag: "Renting", featured: false,
    description: "A modern rental villa with an in-ground pool, available on flexible lease terms.", features: ["In-ground pool", "Flexible lease"] },
  { id: 13, slug: "stonegate-homes", title: "Stonegate Homes", listingType: "rent", propertyType: "Land", price: "$2,786/mo", priceValue: 2786, bedrooms: 3, bathrooms: 9, area: "730 m²", city: "New York City", locationSlug: "new-york-city", address: "12 Stonegate Rd, New York City", agentId: 4, image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=900&auto=format&fit=crop", tag: "Renting", featured: false,
    description: "A large corner-plot property available for long-term rent, with room for expansion subject to permits.", features: ["Corner plot", "Expansion potential"] },
  { id: 14, slug: "blue-sky-residences", title: "Blue Sky Residences", listingType: "rent", propertyType: "Commercial", price: "$901,000/mo", priceValue: 901000, bedrooms: 2, bathrooms: 5, area: "920 m²", city: "London", locationSlug: "london", address: "200 Blue Sky Rd, London", agentId: 3, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=900&auto=format&fit=crop", tag: "Renting", featured: false,
    description: "Ground-floor commercial unit suited to retail or showroom use, on a high-footfall street.", features: ["High footfall street", "Loading access"] },
  { id: 15, slug: "meridian-business-centre", title: "Meridian Business Centre", listingType: "commercial", propertyType: "Office", price: "$4,200/mo", priceValue: 4200, bedrooms: 0, bathrooms: 4, area: "610 m²", city: "London", locationSlug: "london", address: "88 Meridian Rd, London", agentId: 3, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=900&auto=format&fit=crop", tag: "Renting", featured: true,
    description: "Open-plan office floor with meeting rooms already fitted out, available on a flexible commercial lease.", features: ["Fitted meeting rooms", "24/7 building access", "Bike storage"] },
  { id: 16, slug: "portside-warehouse", title: "Portside Warehouse", listingType: "commercial", propertyType: "Commercial", price: "$1,150,000", priceValue: 1150000, bedrooms: 0, bathrooms: 2, area: "1,400 m²", city: "Amsterdam", locationSlug: "amsterdam", address: "3 Portside Quay, Amsterdam", agentId: 1, image: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=900&auto=format&fit=crop", tag: "Selling", featured: false,
    description: "Converted dockside warehouse with high ceilings, suitable for showroom, studio, or light industrial use.", features: ["High ceilings", "Loading dock", "Freight lift"] },
  { id: 17, slug: "champs-retail-unit", title: "Champs Retail Unit", listingType: "commercial", propertyType: "Commercial", price: "$6,800/mo", priceValue: 6800, bedrooms: 0, bathrooms: 1, area: "180 m²", city: "Paris", locationSlug: "paris", address: "56 Rue des Champs, Paris", agentId: 6, image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=900&auto=format&fit=crop", tag: "Renting", featured: false,
    description: "Street-level retail unit with full-height glazing on a well-known shopping street.", features: ["Full-height glazing", "Storage basement"] },
  { id: 18, slug: "riverline-showhome", title: "Riverline Showhome — 2 Bed", listingType: "sale", propertyType: "Apartment", price: "$556,000", priceValue: 556000, bedrooms: 2, bathrooms: 2, area: "84 m²", city: "London", locationSlug: "london", address: "Riverline Towers, London", agentId: 3, image: "https://images.unsplash.com/photo-1499955085172-a104c9463ece?q=80&w=900&auto=format&fit=crop", tag: "Selling", featured: false, projectId: 3,
    description: "Showhome unit within Riverline Towers, available at launch pricing ahead of general release.", features: ["River-facing balcony", "Launch pricing", "Off-plan reservation"] },
];

export const blogPosts = [
  { id: 1, slug: "rising-rates-first-time-buyer-budgets", title: "How rising rates are reshaping first-time buyer budgets", category: "Market Insight", date: "Aug 24, 2026", author: "Flex Home Editorial", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=900&auto=format&fit=crop",
    excerpt: "Monthly payments on a median-priced home have shifted more in the past two years than in the previous ten. Here's what that means for how much house you can actually afford.",
    content: "Monthly payments on a median-priced home have shifted more in the past two years than in the previous decade combined. For buyers working out a realistic budget, the headline price of a property now tells you less than the interest rate attached to it.\n\nA useful way to think about affordability is to work backwards from a monthly payment you're comfortable with, then use a mortgage calculator to see what purchase price that supports at current rates. That number will usually be lower than what a lender is willing to approve you for — approval limits are based on debt-to-income ratios, not on what leaves you comfortable month to month.\n\nBuyers who locked in rates two or three years ago are, understandably, reluctant to sell and re-enter the market at a higher rate on their next home. That's part of why inventory has stayed tight even as demand has cooled slightly. If you're selling and buying in the same window, factor that trade-in cost into your decision alongside the sale price itself." },
  { id: 2, slug: "flexible-work-from-home-layouts", title: "Inside the shift toward flexible, work-from-home layouts", category: "House Design", date: "Aug 18, 2026", author: "Flex Home Editorial", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=900&auto=format&fit=crop",
    excerpt: "Dedicated home offices are now one of the most requested features on buyer wishlists. Here's how new listings are adapting.",
    content: "Dedicated home offices are now one of the most requested features on buyer wishlists, and listings are adapting accordingly. What used to be marketed as a 'bonus room' or 'flex space' is increasingly shown staged as a proper workspace, with attention to natural light and acoustic separation from the rest of the home.\n\nDevelopers building new projects have taken note too: several of the new-build developments on Flex Home now include a shared co-working lounge as a building amenity, aimed at residents who want a change of scenery without a commute.\n\nIf you're touring a home with work-from-home needs in mind, pay attention to where the router and electrical panel sit relative to the room you're considering, and ask whether the building or HOA has any restrictions on business use of a residential unit." },
  { id: 3, slug: "new-build-development-buyer-checklist", title: "A buyer's checklist for touring new-build developments", category: "Guides", date: "Aug 09, 2026", author: "Flex Home Editorial", image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=900&auto=format&fit=crop",
    excerpt: "Buying off-plan or during construction comes with a different set of questions than touring a finished resale home.",
    content: "Buying off-plan or during construction comes with a different set of questions than touring a finished resale home, because you're often judging a showhome or renderings rather than the actual unit you'll own.\n\nStart by asking for the developer's track record on past projects, specifically whether previous handovers happened on schedule. Ask what happens to your deposit if the project is delayed or cancelled, and whether it's held in an escrow account. Request the full specification list for finishes, not just what's shown in the showhome, since upgrades are sometimes swapped for standard fittings without much notice.\n\nFinally, walk the surrounding site plan, not just the show unit. A great apartment can be undermined by a service entrance or car park directly outside the window that isn't obvious from a floor plan alone." },
  { id: 4, slug: "kitchen-renovation-materials-worth-it", title: "Materials worth the upgrade when renovating a kitchen", category: "Building Materials", date: "Jul 30, 2026", author: "Flex Home Editorial", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=900&auto=format&fit=crop",
    excerpt: "Not every finish upgrade pays back at resale. Here's where the data suggests it's worth spending more.",
    content: "Not every finish upgrade pays back at resale. Quartz countertops consistently outperform laminate in buyer surveys and hold up better to daily use than natural stone, without the sealing maintenance marble requires.\n\nCabinet boxes are worth prioritising over cabinet fronts: solid plywood construction lasts substantially longer than particleboard, and it's a detail resale buyers rarely ask about directly but professional inspectors do flag.\n\nWhere it's less worth stretching the budget is on integrated smart appliances tied to a single ecosystem — they date quickly and can be a turn-off for buyers who use a different platform. A well-specified, standard appliance package with good reviews tends to show better long-term value than a flashy but proprietary setup." },
  { id: 5, slug: "renting-vs-buying-2026", title: "Renting vs. buying in 2026: running the actual numbers", category: "Market Insight", date: "Jul 21, 2026", author: "Flex Home Editorial", image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=900&auto=format&fit=crop",
    excerpt: "The rent-vs-buy breakeven point has moved. Here's the simple math to run for your own situation.",
    content: "The rent-vs-buy breakeven point has moved with rates, and the simple rule of thumb ('rent is throwing money away') doesn't hold in every market right now.\n\nA more useful comparison looks at your all-in monthly cost of owning — mortgage payment, taxes, insurance, and an estimate for maintenance — against comparable local rent, then asks how many years you'd need to stay in the home to recoup the upfront closing costs through equity and appreciation.\n\nIn markets where prices have run ahead of rents, that breakeven point can stretch past five years, which matters if your job or plans might move you sooner than that." },
  { id: 6, slug: "neighbourhood-research-before-offer", title: "Five things to research about a neighbourhood before you make an offer", category: "Guides", date: "Jul 12, 2026", author: "Flex Home Editorial", image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=900&auto=format&fit=crop",
    excerpt: "A great house in the wrong neighbourhood for your life is still the wrong house.",
    content: "A great house in the wrong neighbourhood for your life is still the wrong house. Before you make an offer, it's worth spending an hour on research beyond the listing photos.\n\nCheck planned developments nearby — a quiet street can change quickly if a large project is approved next door. Visit at a different time of day than your scheduled viewing, ideally an evening and a weekend morning, to get a sense of noise and traffic. Look up flood zone and insurance data for the specific address, not just the general area. And if schools matter to you, check catchment boundaries directly with the district rather than relying on a listing's claim." },
  { id: 7, slug: "staging-a-home-that-sells-faster", title: "Staging tips that actually shorten time on market", category: "House Design", date: "Jul 03, 2026", author: "Flex Home Editorial", image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=900&auto=format&fit=crop",
    excerpt: "Sellers often over-invest in the wrong rooms. Here's where staging budget tends to move the needle.",
    content: "Sellers often over-invest in staging the wrong rooms. Living rooms and primary bedrooms get the most buyer attention in listing photos and walk-throughs, so that's where a modest staging budget goes furthest.\n\nDecluttering consistently outperforms adding new furniture — buyers need to picture their own belongings in the space, which is harder in a room that's either empty or overstuffed. A fresh coat of neutral paint remains one of the highest-return, lowest-cost changes available before listing." },
  { id: 8, slug: "commercial-lease-terms-explained", title: "Commercial lease terms every small business tenant should understand", category: "Guides", date: "Jun 22, 2026", author: "Flex Home Editorial", image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=900&auto=format&fit=crop",
    excerpt: "Triple net, gross lease, percentage rent — a plain-language guide before you sign.",
    content: "Commercial leases use terms residential renters rarely encounter. A triple net (NNN) lease means the tenant pays base rent plus a share of property taxes, insurance, and maintenance — so the headline rent figure understates your actual monthly cost. A gross lease bundles those costs into one number, which is easier to budget against but often carries a higher base rent.\n\nPercentage rent clauses, common in retail, add a share of revenue above a sales threshold on top of base rent — worth modelling carefully against your projected sales before agreeing to one. Always confirm who is responsible for structural repairs versus interior fit-out, since 'maintenance' is defined differently across leases." },
];

export const faqs = [
  { id: 1, category: "Buying", question: "Do I need to be pre-approved before I start touring homes?", answer: "It isn't required to book a viewing, but we recommend getting pre-approved early. It tells you your realistic budget before you fall for something outside it, and it makes your offer more competitive once you find the right place." },
  { id: 2, category: "Buying", question: "How accurate are the listing photos and details?", answer: "Every listing on Flex Home is checked against ownership documents before publishing, and agents are required to update photos within 48 hours of any material change to the property." },
  { id: 3, category: "Renting", question: "What documents do I need to apply for a rental?", answer: "Typically proof of income, a form of ID, and references from a previous landlord or employer. Exact requirements vary by listing and are shown on the property page." },
  { id: 4, category: "Renting", question: "Is the deposit refundable?", answer: "Security deposits are refundable at the end of the lease, subject to the property's condition report at move-out, as outlined in your lease agreement." },
  { id: 5, category: "Selling", question: "How do I list my property on Flex Home?", answer: "Click 'Add Property' in the header, or contact one of our featured agents directly. You'll need proof of ownership and recent photos to get a listing published." },
  { id: 6, category: "Selling", question: "What fees does Flex Home charge sellers?", answer: "Flex Home itself doesn't charge listing fees to sellers. Agent commission is agreed directly between you and your chosen agent and is disclosed before you sign a listing agreement." },
  { id: 7, category: "New Projects", question: "What's the difference between presale and under construction?", answer: "Presale means reservations are open before construction has started or is early stage. Under construction means the building is actively being built, with a firmer estimated handover date." },
  { id: 8, category: "New Projects", question: "Is my deposit protected if a project is delayed or cancelled?", answer: "Each project page lists whether deposits are held in escrow. We recommend confirming this directly with the developer before reserving a unit." },
  { id: 9, category: "General", question: "Can I save properties to review later?", answer: "Yes — create a free account and use the heart icon on any listing to add it to your saved properties." },
  { id: 10, category: "General", question: "How do I contact an agent directly?", answer: "Every agent profile lists a phone number, email, and WhatsApp link. You can also use the enquiry form on any property or project page." },
];

export const testimonials = [
  { name: "Marcus Devlin", role: "Bought a villa in Munich", quote: "The search filters and the agent matching saved us weeks of driving around neighborhoods we didn't even like.", rating: 5 },
  { name: "Priya Raman", role: "Rented an apartment in Amsterdam", quote: "Every listing had accurate photos and pricing. No surprises when we showed up for the viewing.", rating: 5 },
  { name: "Tomás Ferreira", role: "Invested in a new project", quote: "Being able to track construction milestones on the project page made a six-figure decision feel much safer.", rating: 4 },
];

export const categories = [
  { name: "Apartments", slug: "apartment", count: 1240, icon: "building-2" },
  { name: "Villas", slug: "villa", count: 486, icon: "home" },
  { name: "Houses", slug: "house", count: 902, icon: "warehouse" },
  { name: "Land", slug: "land", count: 318, icon: "trees" },
  { name: "Commercial", slug: "commercial", count: 214, icon: "store" },
  { name: "Office Space", slug: "office", count: 176, icon: "briefcase" },
];

export const stats = [
  { label: "Properties listed", value: "12,400+" },
  { label: "Verified agents", value: "860+" },
  { label: "Cities covered", value: "48" },
  { label: "Happy clients", value: "9,300+" },
];

export const staticPages = {
  "about-us": {
    title: "About Flex Home",
    content: `Flex Home started in 2019 with a simple frustration: listings that didn't match reality, and agents who took days to reply. We set out to build a portal where every listing is checked before it goes live and every agent is measured on how fast they respond.

Today we list properties for sale, rent, and commercial use across 48 cities, working with independent agents, agencies, and developers directly. Our team reviews ownership documents and photo accuracy before anything is published, and we publish average response times on every agent profile so you can see who actually answers.

We're not a developer or a brokerage ourselves — we're the layer that makes it easier to find the right agent, the right building, and the right property, with fewer surprises along the way.`,
  },
  "privacy-policy": {
    title: "Privacy Policy",
    content: `This policy explains what information Flex Home collects when you use our site, and how it's used.

We collect information you provide directly, such as when you create an account, save a property, or contact an agent through our forms — including your name, email, phone number, and any message content. We also collect usage data such as pages viewed and searches performed, which helps us improve listing relevance.

We share your contact details with an agent or developer only when you submit an enquiry about their listing. We do not sell personal data to third parties. You can request a copy of your data or ask us to delete your account at any time by contacting privacy@flexhome.example.

We use cookies for essential site functionality and, with your consent, for analytics that help us understand which features are useful. You can manage cookie preferences from the banner shown on your first visit or from your account settings.`,
  },
  "terms": {
    title: "Terms & Conditions",
    content: `By using Flex Home, you agree to the following terms.

Listings are provided by agents, agencies, and developers, and while we review documents before publishing, Flex Home does not guarantee the accuracy of every detail and is not a party to any resulting transaction. Buyers and renters are responsible for their own due diligence, including independent inspections and legal review.

Accounts are for personal, non-commercial use unless you're registered as an agent or developer. You agree not to scrape, republish, or resell listing data obtained from the site. We may suspend accounts that provide false information or misuse the enquiry system to send unsolicited messages.

We may update these terms from time to time; continued use of the site after a change constitutes acceptance of the updated terms.`,
  },
};
