// Seeds the database with demo content: the agents and properties already
// shown on the site when no database is connected (lib/data.js), inserted
// as real rows so they're editable from /admin and persist across restarts.
//
// Usage: npm run db:seed  (run `npm run db:init` first if you haven't)
// Safe to re-run — existing rows (matched by email / slug) are updated in
// place rather than duplicated.

import "dotenv/config";
import mysql from "mysql2/promise";
import { agents as seedAgents, properties as seedProperties } from "../lib/data.js";

// Full "Add Property" amenities catalog — matches lib/amenityIcons.js's
// AMENITY_ICONS keys and AMENITY_CATEGORIES groups. Upserted by name so
// re-running this script keeps icon/category assignments in sync without
// duplicating rows (amenities.name is UNIQUE, case-insensitive).
const AMENITIES_CATALOG = [
  // Parking & Convenience
  { category: "parking_convenience", name: "Covered Parking", icon_key: "covered_parking" },
  { category: "parking_convenience", name: "Open Parking", icon_key: "open_parking" },
  { category: "parking_convenience", name: "Visitor Parking", icon_key: "parking" },
  { category: "parking_convenience", name: "Lift / Elevator", icon_key: "elevator" },
  { category: "parking_convenience", name: "Power Backup", icon_key: "power_backup" },
  { category: "parking_convenience", name: "Water Supply", icon_key: "water_supply" },
  { category: "parking_convenience", name: "Gas Pipeline", icon_key: "gas_pipeline" },
  { category: "parking_convenience", name: "Service/Emergency Lift", icon_key: "emergency_lift" },
  { category: "parking_convenience", name: "Wheelchair Accessibility", icon_key: "wheelchair_access" },
  { category: "parking_convenience", name: "CCTV Security", icon_key: "cctv" },
  { category: "parking_convenience", name: "Security Guard", icon_key: "security_guard" },
  { category: "parking_convenience", name: "Intercom Facility", icon_key: "intercom" },

  // Outdoor & Lifestyle
  { category: "outdoor_lifestyle", name: "Garden", icon_key: "garden" },
  { category: "outdoor_lifestyle", name: "Private Garden", icon_key: "private_garden" },
  { category: "outdoor_lifestyle", name: "Terrace", icon_key: "terrace" },
  { category: "outdoor_lifestyle", name: "Private Terrace", icon_key: "private_terrace" },
  { category: "outdoor_lifestyle", name: "Swimming Pool", icon_key: "swimming_pool" },
  { category: "outdoor_lifestyle", name: "Kids Play Area", icon_key: "kids_area" },
  { category: "outdoor_lifestyle", name: "Clubhouse", icon_key: "clubhouse" },
  { category: "outdoor_lifestyle", name: "Gym / Fitness Center", icon_key: "gym" },
  { category: "outdoor_lifestyle", name: "Jogging Track", icon_key: "jogging_track" },
  { category: "outdoor_lifestyle", name: "Sports Facilities", icon_key: "sports_facility" },
  { category: "outdoor_lifestyle", name: "Community Hall", icon_key: "community_hall" },
  { category: "outdoor_lifestyle", name: "Party/Lounge Area", icon_key: "lounge_area" },

  // Security & Smart Features
  { category: "security_smart", name: "Gated Community", icon_key: "gated_access" },
  { category: "security_smart", name: "24×7 Security", icon_key: "security" },
  { category: "security_smart", name: "Video Door Phone", icon_key: "video_door_phone" },
  { category: "security_smart", name: "Smart Door Lock", icon_key: "smart_lock" },
  { category: "security_smart", name: "Smart Home Automation", icon_key: "smart_automation" },
  { category: "security_smart", name: "Fire Safety System", icon_key: "fire_safety" },
  { category: "security_smart", name: "Smoke Detector", icon_key: "smoke_detector" },
  { category: "security_smart", name: "Fire Extinguisher", icon_key: "fire_extinguisher" },
  { category: "security_smart", name: "Earthquake Resistant Structure", icon_key: "earthquake_resistant" },
  { category: "security_smart", name: "Access Control", icon_key: "access_control" },
  { category: "security_smart", name: "Visitor Management System", icon_key: "visitor_management" },

  // Utilities & Infrastructure
  { category: "utilities_infrastructure", name: "Solar Water Heater", icon_key: "solar_water_heater" },
  { category: "utilities_infrastructure", name: "Solar Power", icon_key: "solar_power" },
  { category: "utilities_infrastructure", name: "Rainwater Harvesting", icon_key: "rainwater_harvesting" },
  { category: "utilities_infrastructure", name: "Sewage Treatment Plant", icon_key: "sewage_treatment" },
  { category: "utilities_infrastructure", name: "Waste Disposal", icon_key: "waste_disposal" },
  { category: "utilities_infrastructure", name: "Water Storage", icon_key: "water_storage" },
  { category: "utilities_infrastructure", name: "Borewell", icon_key: "borewell" },
  { category: "utilities_infrastructure", name: "EV Charging Station", icon_key: "ev_charging" },
  { category: "utilities_infrastructure", name: "Central Air Conditioning", icon_key: "air_conditioning" },
  { category: "utilities_infrastructure", name: "Internet/Wi-Fi Connectivity", icon_key: "wifi" },
  { category: "utilities_infrastructure", name: "DTH/Cable Connection", icon_key: "smart_tv" },
  { category: "utilities_infrastructure", name: "Electricity Backup", icon_key: "power_backup" },

  // Interior Features
  { category: "interior_features", name: "Modular Kitchen", icon_key: "modular_kitchen" },
  { category: "interior_features", name: "Chimney", icon_key: "chimney" },
  { category: "interior_features", name: "Wardrobes", icon_key: "wardrobes" },
  { category: "interior_features", name: "Walk-in Closet", icon_key: "walk_in_closet" },
  { category: "interior_features", name: "False Ceiling", icon_key: "false_ceiling" },
  { category: "interior_features", name: "Premium Flooring", icon_key: "premium_flooring" },
  { category: "interior_features", name: "Wooden Flooring", icon_key: "wooden_flooring" },
  { category: "interior_features", name: "Air Conditioning", icon_key: "air_conditioning" },
  { category: "interior_features", name: "Heating System", icon_key: "heating" },
  { category: "interior_features", name: "Attached Bathrooms", icon_key: "attached_bathroom" },
  { category: "interior_features", name: "Study Room", icon_key: "study_room" },
  { category: "interior_features", name: "Pooja Room", icon_key: "pooja_room" },
  { category: "interior_features", name: "Servant Room", icon_key: "servant_room" },
  { category: "interior_features", name: "Store Room", icon_key: "storage" },
  { category: "interior_features", name: "Utility Room", icon_key: "utility_room" },

  // Location & Nearby Facilities
  { category: "location_nearby", name: "Main Road Facing", icon_key: "main_road_facing" },
  { category: "location_nearby", name: "Corner Property", icon_key: "corner_property" },
  { category: "location_nearby", name: "Park Facing", icon_key: "park_facing" },
  { category: "location_nearby", name: "Pool Facing", icon_key: "pool_facing" },
  { category: "location_nearby", name: "Road View", icon_key: "road_view" },
  { category: "location_nearby", name: "City View", icon_key: "city_view" },
  { category: "location_nearby", name: "School Nearby", icon_key: "school_nearby" },
  { category: "location_nearby", name: "Hospital Nearby", icon_key: "hospital_nearby" },
  { category: "location_nearby", name: "Shopping Mall Nearby", icon_key: "mall_nearby" },
  { category: "location_nearby", name: "Metro/Transit Nearby", icon_key: "metro_nearby" },
  { category: "location_nearby", name: "Airport Connectivity", icon_key: "airport_connectivity" },
  { category: "location_nearby", name: "Highway Connectivity", icon_key: "highway_connectivity" },
  { category: "location_nearby", name: "Restaurant/Cafe Nearby", icon_key: "restaurant_nearby" },
  { category: "location_nearby", name: "Market Nearby", icon_key: "market_nearby" },

  // Premium & Advanced Features
  { category: "premium_advanced", name: "Sea/Lake View", icon_key: "sea_view" },
  { category: "premium_advanced", name: "Mountain View", icon_key: "mountain_view" },
  { category: "premium_advanced", name: "Panoramic View", icon_key: "panoramic_view" },
  { category: "premium_advanced", name: "Private Swimming Pool", icon_key: "private_pool" },
  { category: "premium_advanced", name: "Private Elevator", icon_key: "private_elevator" },
  { category: "premium_advanced", name: "Home Theater", icon_key: "home_theater" },
  { category: "premium_advanced", name: "Private Gym", icon_key: "private_gym" },
  { category: "premium_advanced", name: "Rooftop Access", icon_key: "rooftop_access" },
  { category: "premium_advanced", name: "Sky Lounge", icon_key: "sky_lounge" },
  { category: "premium_advanced", name: "Concierge Service", icon_key: "concierge" },
  { category: "premium_advanced", name: "Housekeeping Service", icon_key: "housekeeping" },
  { category: "premium_advanced", name: "Property Management Service", icon_key: "property_management" },

  // Smart Property Features
  { category: "smart_features", name: "Smart Home", icon_key: "smart_automation" },
  { category: "smart_features", name: "Smart Lighting", icon_key: "smart_lighting" },
  { category: "smart_features", name: "Smart AC Control", icon_key: "smart_ac" },
  { category: "smart_features", name: "Smart Curtains", icon_key: "smart_curtains" },
  { category: "smart_features", name: "Smart Door Lock", icon_key: "smart_lock" },
  { category: "smart_features", name: "Smart Doorbell", icon_key: "smart_doorbell" },
  { category: "smart_features", name: "Smart Security System", icon_key: "smart_security_system" },
  { category: "smart_features", name: "Voice Assistant Integration", icon_key: "voice_assistant" },
  { category: "smart_features", name: "Motion Sensors", icon_key: "motion_sensor" },
  { category: "smart_features", name: "Temperature Sensors", icon_key: "temperature_sensor" },
  { category: "smart_features", name: "Water Leak Detection", icon_key: "water_leak_detection" },
  { category: "smart_features", name: "Gas Leak Detection", icon_key: "gas_leak_detection" },
  { category: "smart_features", name: "Energy Monitoring", icon_key: "energy_monitoring" },
  { category: "smart_features", name: "Remote Home Monitoring", icon_key: "remote_monitoring" },
  { category: "smart_features", name: "Mobile App Controlled Devices", icon_key: "mobile_app_control" },

  // Energy & Sustainability
  { category: "energy_sustainability", name: "Solar Panels", icon_key: "solar_panels" },
  { category: "energy_sustainability", name: "Solar Water Heating", icon_key: "solar_water_heater" },
  { category: "energy_sustainability", name: "Renewable Energy", icon_key: "renewable_energy" },
  { category: "energy_sustainability", name: "Energy Efficient Appliances", icon_key: "energy_efficient_appliances" },
  { category: "energy_sustainability", name: "Energy Efficient Lighting", icon_key: "energy_efficient_lighting" },
  { category: "energy_sustainability", name: "Green Building", icon_key: "green_building" },
  { category: "energy_sustainability", name: "IGBC Certified", icon_key: "igbc_certified" },
  { category: "energy_sustainability", name: "LEED Certified", icon_key: "leed_certified" },
  { category: "energy_sustainability", name: "Energy Rating", icon_key: "energy_rating" },
  { category: "energy_sustainability", name: "Rainwater Harvesting", icon_key: "rainwater_harvesting" },
  { category: "energy_sustainability", name: "Greywater Recycling", icon_key: "greywater_recycling" },
  { category: "energy_sustainability", name: "Sewage Treatment Plant", icon_key: "sewage_treatment" },
  { category: "energy_sustainability", name: "Organic Waste Treatment", icon_key: "organic_waste_treatment" },
  { category: "energy_sustainability", name: "Waste Segregation", icon_key: "waste_segregation" },
  { category: "energy_sustainability", name: "EV Charging", icon_key: "ev_charging" },
  { category: "energy_sustainability", name: "Bicycle Parking", icon_key: "bicycle_parking" },
  { category: "energy_sustainability", name: "Green Landscaping", icon_key: "green_landscaping" },
  { category: "energy_sustainability", name: "Low-Flow Plumbing", icon_key: "low_flow_plumbing" },
  { category: "energy_sustainability", name: "Natural Ventilation", icon_key: "natural_ventilation" },

  // Advanced Security
  { category: "advanced_security", name: "Multi-Level Security", icon_key: "multi_level_security" },
  { category: "advanced_security", name: "Gated Entry", icon_key: "gated_entry" },
  { category: "advanced_security", name: "RFID Vehicle Access", icon_key: "rfid_vehicle_access" },
  { category: "advanced_security", name: "ANPR Vehicle Recognition", icon_key: "anpr_recognition" },
  { category: "advanced_security", name: "Facial Recognition", icon_key: "facial_recognition" },
  { category: "advanced_security", name: "Biometric Access", icon_key: "biometric_access" },
  { category: "advanced_security", name: "Smart Access Cards", icon_key: "smart_access_cards" },
  { category: "advanced_security", name: "Visitor Management", icon_key: "visitor_management" },
  { category: "advanced_security", name: "Video Intercom", icon_key: "video_door_phone" },
  { category: "advanced_security", name: "CCTV Monitoring", icon_key: "cctv_monitoring" },
  { category: "advanced_security", name: "Lift Access Control", icon_key: "lift_access_control" },
  { category: "advanced_security", name: "Emergency Panic Button", icon_key: "panic_button" },
  { category: "advanced_security", name: "Fire Alarm", icon_key: "fire_alarm" },
  { category: "advanced_security", name: "Smoke Detection", icon_key: "smoke_detection" },
  { category: "advanced_security", name: "Sprinkler System", icon_key: "sprinkler_system" },
  { category: "advanced_security", name: "Fire Hydrant", icon_key: "fire_hydrant" },
  { category: "advanced_security", name: "Emergency Exit", icon_key: "emergency_exit" },
  { category: "advanced_security", name: "Earthquake Resistant", icon_key: "earthquake_resistant" },
  { category: "advanced_security", name: "Security Control Room", icon_key: "security_control_room" },
  { category: "advanced_security", name: "Security Patrol", icon_key: "security_patrol" },

  // Building & Infrastructure
  { category: "building_infrastructure", name: "Earthquake Zone Rating", icon_key: "earthquake_zone_rating" },
  { category: "building_infrastructure", name: "Building Completion Certificate", icon_key: "completion_certificate" },
  { category: "building_infrastructure", name: "Occupancy Certificate", icon_key: "occupancy_certificate" },
  { category: "building_infrastructure", name: "Fire NOC", icon_key: "fire_noc" },
  { category: "building_infrastructure", name: "Structural Audit", icon_key: "structural_audit" },
  { category: "building_infrastructure", name: "Waterproofing", icon_key: "waterproofing" },
  { category: "building_infrastructure", name: "Anti-Termite Treatment", icon_key: "anti_termite_treatment" },
  { category: "building_infrastructure", name: "High-Speed Elevators", icon_key: "high_speed_elevators" },
  { category: "building_infrastructure", name: "Service Elevator", icon_key: "service_elevator" },
  { category: "building_infrastructure", name: "Separate Entrance", icon_key: "separate_entrance" },
  { category: "building_infrastructure", name: "Double-Glazed Windows", icon_key: "double_glazed_windows" },
  { category: "building_infrastructure", name: "Soundproof Windows", icon_key: "soundproof_windows" },
  { category: "building_infrastructure", name: "Acoustic Walls", icon_key: "acoustic_walls" },
  { category: "building_infrastructure", name: "Heat-Reflective Glass", icon_key: "heat_reflective_glass" },
  { category: "building_infrastructure", name: "Premium Facade", icon_key: "premium_facade" },
  { category: "building_infrastructure", name: "Basement Parking", icon_key: "basement_parking" },
  { category: "building_infrastructure", name: "Mechanical Parking", icon_key: "mechanical_parking" },
  { category: "building_infrastructure", name: "Loading/Unloading Area", icon_key: "loading_area" },

  // Premium Lifestyle
  { category: "premium_lifestyle", name: "Infinity Pool", icon_key: "infinity_pool" },
  { category: "premium_lifestyle", name: "Rooftop Pool", icon_key: "rooftop_pool" },
  { category: "premium_lifestyle", name: "Heated Pool", icon_key: "heated_pool" },
  { category: "premium_lifestyle", name: "Jacuzzi", icon_key: "jacuzzi" },
  { category: "premium_lifestyle", name: "Sauna", icon_key: "sauna" },
  { category: "premium_lifestyle", name: "Steam Room", icon_key: "steam_room" },
  { category: "premium_lifestyle", name: "Spa", icon_key: "spa" },
  { category: "premium_lifestyle", name: "Yoga Studio", icon_key: "yoga_studio" },
  { category: "premium_lifestyle", name: "Meditation Room", icon_key: "meditation_room" },
  { category: "premium_lifestyle", name: "Indoor Sports", icon_key: "indoor_sports" },
  { category: "premium_lifestyle", name: "Outdoor Sports", icon_key: "outdoor_sports" },
  { category: "premium_lifestyle", name: "Tennis Court", icon_key: "tennis_court" },
  { category: "premium_lifestyle", name: "Basketball Court", icon_key: "basketball_court" },
  { category: "premium_lifestyle", name: "Badminton Court", icon_key: "badminton_court" },
  { category: "premium_lifestyle", name: "Cricket Practice Area", icon_key: "cricket_practice_area" },
  { category: "premium_lifestyle", name: "Jogging Track", icon_key: "jogging_track" },
  { category: "premium_lifestyle", name: "Cycling Track", icon_key: "cycling_track" },
  { category: "premium_lifestyle", name: "Pet Park", icon_key: "pet_park" },
  { category: "premium_lifestyle", name: "Kids Activity Center", icon_key: "kids_activity_center" },
  { category: "premium_lifestyle", name: "Senior Citizen Lounge", icon_key: "senior_lounge" },
  { category: "premium_lifestyle", name: "Library", icon_key: "library" },
  { category: "premium_lifestyle", name: "Co-working Space", icon_key: "coworking_space" },
  { category: "premium_lifestyle", name: "Business Center", icon_key: "business_center" },
  { category: "premium_lifestyle", name: "Gaming Zone", icon_key: "gaming_zone" },
  { category: "premium_lifestyle", name: "Movie Theater", icon_key: "movie_theater" },
  { category: "premium_lifestyle", name: "Music Room", icon_key: "music_room" },
  { category: "premium_lifestyle", name: "Party Hall", icon_key: "party_hall" },
  { category: "premium_lifestyle", name: "Rooftop Lounge", icon_key: "rooftop_lounge" },

  // Hotel-Like Services
  { category: "hotel_services", name: "Concierge", icon_key: "concierge" },
  { category: "hotel_services", name: "Housekeeping", icon_key: "housekeeping" },
  { category: "hotel_services", name: "Laundry Service", icon_key: "laundry_service" },
  { category: "hotel_services", name: "Dry Cleaning", icon_key: "dry_cleaning" },
  { category: "hotel_services", name: "Room Service", icon_key: "room_service" },
  { category: "hotel_services", name: "Grocery Delivery", icon_key: "grocery_delivery" },
  { category: "hotel_services", name: "Cab Booking", icon_key: "cab_booking" },
  { category: "hotel_services", name: "Car Wash", icon_key: "car_wash" },
  { category: "hotel_services", name: "Car Maintenance", icon_key: "car_maintenance" },
  { category: "hotel_services", name: "Pet Care", icon_key: "pet_care" },
  { category: "hotel_services", name: "Babysitting", icon_key: "babysitting" },
  { category: "hotel_services", name: "On-Demand Maintenance", icon_key: "on_demand_maintenance" },
  { category: "hotel_services", name: "Plumber on Call", icon_key: "plumber_on_call" },
  { category: "hotel_services", name: "Electrician on Call", icon_key: "electrician_on_call" },
  { category: "hotel_services", name: "Technician on Call", icon_key: "technician_on_call" },
  { category: "hotel_services", name: "Security Assistance", icon_key: "security_assistance" },
  { category: "hotel_services", name: "Guest Management", icon_key: "guest_management" },
  { category: "hotel_services", name: "Package Delivery Management", icon_key: "package_delivery_management" },

  // Advanced Parking
  { category: "advanced_parking", name: "Dedicated Parking", icon_key: "dedicated_parking" },
  { category: "advanced_parking", name: "Multiple Parking Slots", icon_key: "multiple_parking_slots" },
  { category: "advanced_parking", name: "Automated Parking", icon_key: "automated_parking" },
  { category: "advanced_parking", name: "Mechanical Parking", icon_key: "mechanical_parking" },
  { category: "advanced_parking", name: "Fast EV Charging", icon_key: "fast_ev_charging" },
  { category: "advanced_parking", name: "Visitor Parking", icon_key: "parking" },
  { category: "advanced_parking", name: "Bicycle Parking", icon_key: "bicycle_parking" },
  { category: "advanced_parking", name: "Car Wash Facility", icon_key: "car_wash_facility" },
  { category: "advanced_parking", name: "Valet Parking", icon_key: "valet_parking" },
  { category: "advanced_parking", name: "Car Service Area", icon_key: "car_service_area" },
  { category: "advanced_parking", name: "Two-Wheeler Parking", icon_key: "two_wheeler_parking" },
  { category: "advanced_parking", name: "Basement Parking", icon_key: "basement_parking" },
  { category: "advanced_parking", name: "Parking Camera", icon_key: "parking_camera" },

  // View & Location Intelligence
  { category: "view_location_intel", name: "Skyline View", icon_key: "skyline_view" },
  { category: "view_location_intel", name: "Garden View", icon_key: "garden_view" },
  { category: "view_location_intel", name: "Park View", icon_key: "park_view" },
  { category: "view_location_intel", name: "Pool View", icon_key: "pool_view" },
  { category: "view_location_intel", name: "Lake View", icon_key: "lake_view" },
  { category: "view_location_intel", name: "River View", icon_key: "river_view" },
  { category: "view_location_intel", name: "Golf Course View", icon_key: "golf_course_view" },
  { category: "view_location_intel", name: "Main Road View", icon_key: "main_road_view" },
  { category: "view_location_intel", name: "Sunrise View", icon_key: "sunrise_view" },
  { category: "view_location_intel", name: "Sunset View", icon_key: "sunset_view" },
  { category: "view_location_intel", name: "Corner Unit", icon_key: "corner_unit" },
  { category: "view_location_intel", name: "Zero Traffic View", icon_key: "zero_traffic_view" },
  { category: "view_location_intel", name: "Quiet Neighborhood", icon_key: "quiet_neighborhood" },
  { category: "view_location_intel", name: "Green Zone View", icon_key: "green_zone_view" },
];

// Categorizes the original demo amenities that predate this catalog and
// don't exactly name-match one of the entries above (those get updated
// automatically via the upsert below).
const LEGACY_CATEGORY_BY_NAME = {
  "Roof terrace": "outdoor_lifestyle",
  "Parking": "parking_convenience",
  "Pet friendly": "outdoor_lifestyle",
  "Home office": "interior_features",
  "Concierge": "premium_advanced",
  "Gym": "outdoor_lifestyle",
  "Wifi": "utilities_infrastructure",
  "24/7 security": "security_smart",
  "EV charging": "utilities_infrastructure",
  "Elevator": "parking_convenience",
};

const PROPERTY_TYPE_MAP = {
  apartment: "apartment",
  villa: "villa",
  house: "house",
  land: "land",
  commercial: "commercial",
  office: "office",
  condo: "apartment", // no dedicated enum value — condos list under apartment
};

const SUBCATEGORY_SLUG_BY_TYPE = {
  apartment: "apartment",
  villa: "villa",
  house: "house",
  land: "plot",
  commercial: "commercial-space",
  office: "office",
  condo: "apartment",
};

const GALLERY_EXTRAS = [
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=900&auto=format&fit=crop",
];

function parsePricePeriod(priceLabel) {
  if (/\/mo$/i.test(priceLabel)) return "monthly";
  if (/\/yr$/i.test(priceLabel)) return "yearly";
  return "one_time";
}

function parseAreaSqm(areaLabel) {
  if (!areaLabel) return null;
  const n = Number(String(areaLabel).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Deterministic (not random) dummy values for the extended "Add Property"
// fields — admin panel and database/schema.sql have long since grown these
// columns, but lib/data.js's demo listings predate them and nothing ever
// backfilled the DB rows, so the property detail page had nothing to show
// for facing/furnishing/floor/etc. Derived from each property's own index
// and attributes so re-running the seed keeps producing the same values.
const FACING_OPTIONS = ["east", "west", "north", "south", "north_east", "north_west", "south_east", "south_west"];
const FURNISHING_OPTIONS = ["furnished", "semi_furnished", "unfurnished"];
const CONSTRUCTION_OPTIONS = ["ready_to_move", "under_construction", "new_launch"];

function extraDetailsFor(p, index, areaSqm) {
  const isLand = p.propertyType.toLowerCase() === "land";
  const facing = FACING_OPTIONS[index % FACING_OPTIONS.length];

  if (isLand) {
    return {
      balconies: 0, floor_number: null, total_floors: null, property_age: null,
      facing, furnishing: null, parking: 0, parking_spaces: 0,
      construction_status: null, possession_date: null,
      carpet_area_sqm: null, built_up_area_sqm: null,
    };
  }

  const isCommercial = ["commercial", "office"].includes(p.propertyType.toLowerCase());
  const totalFloors = 2 + (index % 8); // 2..9
  const floorNumber = 1 + (index % totalFloors);
  const constructionStatus = CONSTRUCTION_OPTIONS[index % CONSTRUCTION_OPTIONS.length];
  const possessionDate =
    constructionStatus === "ready_to_move"
      ? null
      : new Date(Date.now() + (90 + index * 30) * 86400000).toISOString().slice(0, 10);

  return {
    balconies: isCommercial ? 0 : Math.max(0, (p.bedrooms || 1) - 1),
    floor_number: floorNumber,
    total_floors: totalFloors,
    property_age: constructionStatus === "new_launch" ? "New" : `${1 + (index % 12)} years`,
    facing,
    furnishing: isCommercial ? null : FURNISHING_OPTIONS[index % FURNISHING_OPTIONS.length],
    parking: 1,
    parking_spaces: 1 + (index % 3),
    construction_status: constructionStatus,
    possession_date: possessionDate,
    // Carpet < built-up < plot/super area, roughly, when we have a plot area to work from.
    carpet_area_sqm: areaSqm ? Math.round(areaSqm * 0.78 * 100) / 100 : null,
    built_up_area_sqm: areaSqm ? Math.round(areaSqm * 0.92 * 100) / 100 : null,
  };
}

// Deterministic dummy values for the "Property Intelligence" and
// "Financial & Investment" fields — same reasoning as extraDetailsFor:
// derived from index/price so the property page has real content to show
// instead of empty fields, without being random/irreproducible.
const BUILDER_NAMES = ["Meridian Developers", "Northgate Estates", "Silverline Builders", "Coastal Living Group"];
const TAX_STATUSES = ["paid", "pending", "included_in_maintenance"];
const MAINTENANCE_FREQUENCIES = ["monthly", "quarterly", "half_yearly", "yearly"];
const APPRECIATION_LEVELS = ["low", "medium", "high"];

function intelligenceDetailsFor(p, index, priceValue) {
  const isLand = p.propertyType.toLowerCase() === "land";
  const listingCondition = index % 3 === 0 ? "new" : "resale";
  const rentalYield = isLand ? null : Math.round((3 + ((index * 7) % 40) / 10) * 100) / 100; // ~3.0–6.9%
  const estimatedMonthlyRent = isLand ? null : Math.round((priceValue * (rentalYield / 100)) / 12);

  return {
    listing_condition: listingCondition,
    builder_name: isLand ? null : BUILDER_NAMES[index % BUILDER_NAMES.length],
    tower_block: isLand ? null : `Tower ${String.fromCharCode(65 + (index % 4))}`,
    unit_number: isLand ? null : `${2 + (index % 8)}0${1 + (index % 9)}`,
    parking_slot_number: isLand ? null : `B${1 + (index % 3)}-${10 + index}`,
    last_renovated_date:
      listingCondition === "resale" ? new Date(Date.now() - (400 + index * 60) * 86400000).toISOString().slice(0, 10) : null,
    maintenance_frequency: isLand ? null : MAINTENANCE_FREQUENCIES[index % MAINTENANCE_FREQUENCIES.length],
    property_tax_status: TAX_STATUSES[index % TAX_STATUSES.length],
    loan_available: index % 5 === 0 ? 0 : 1,
    verified: index % 6 === 0 ? 0 : 1,
    approved: isLand ? 0 : index % 4 === 0 ? 0 : 1,
    rera_number: isLand || index % 3 === 2 ? null : `RERA/P5${2100 + index}/${2024 + (index % 2)}`,
    property_custom_id: `FH-${2024 + (index % 2)}-${String(index + 1).padStart(4, "0")}`,
    rental_yield_percent: rentalYield,
    estimated_monthly_rent: estimatedMonthlyRent,
    capital_appreciation: APPRECIATION_LEVELS[index % APPRECIATION_LEVELS.length],
    investment_score: 1 + (index % 5),
    rental_demand_score: 1 + ((index + 2) % 5),
    location_growth_score: 1 + ((index + 4) % 5),
    future_development_score: 1 + ((index + 1) % 5),
    brokerage: Math.round(priceValue * 0.01),
    registration_charges: Math.round(priceValue * 0.01),
    stamp_duty: Math.round(priceValue * (0.05 + (index % 3) * 0.005)),
    other_charges: 5000 + (index % 5) * 1500,
  };
}

const AMENITY_CATEGORY_ORDER = [
  "parking_convenience", "outdoor_lifestyle", "security_smart",
  "utilities_infrastructure", "interior_features", "location_nearby", "premium_advanced",
  "smart_features", "energy_sustainability", "advanced_security", "building_infrastructure",
  "premium_lifestyle", "hotel_services", "advanced_parking", "view_location_intel",
];
// Land has no interior/building/hotel-service/parking-structure concepts.
const LAND_EXCLUDED_CATEGORIES = new Set([
  "interior_features", "smart_features", "building_infrastructure", "hotel_services", "premium_lifestyle", "advanced_parking",
]);

// Deterministic spread across categories (not random) so every property
// shows a rich, varied set of amenities on the detail page instead of just
// its 2-5 hand-picked lib/data.js features — while different properties
// still end up with different picks within each category.
function pickAmenities(amenitiesByCategory, categories, index, perCategory = 2) {
  const picked = [];
  for (const cat of categories) {
    const list = amenitiesByCategory[cat] || [];
    for (let i = 0; i < Math.min(perCategory, list.length); i++) {
      picked.push(list[(index + i) % list.length]);
    }
  }
  return picked;
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "flexhome",
  });

  console.log(`Seeding demo data into database "${process.env.DB_NAME || "flexhome"}"...`);

  // ---------- Lookups ----------
  const [locationRows] = await connection.query("SELECT id, city FROM locations");
  const locationIdByCity = Object.fromEntries(locationRows.map((r) => [r.city, r.id]));

  const [subcategoryRows] = await connection.query(
    "SELECT s.id, s.slug, s.category_id FROM subcategories s"
  );
  const subcategoryBySlug = Object.fromEntries(subcategoryRows.map((r) => [r.slug, r]));

  // ---------- Agents (users + agents rows) ----------
  const agentIdBySeedId = {};
  for (const agent of seedAgents) {
    await connection.query(
      `INSERT INTO users (name, email, password_hash, role, phone, avatar_url)
       VALUES (?, ?, ?, 'agent', ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), avatar_url = VALUES(avatar_url)`,
      [agent.name, agent.email, "$2a$10$seedaccountnologinhashplaceholder000000", agent.phone, agent.image]
    );
    const [[userRow]] = await connection.query("SELECT id FROM users WHERE email = ?", [agent.email]);

    const [[existingAgent]] = await connection.query("SELECT id FROM agents WHERE user_id = ?", [userRow.id]);
    if (existingAgent) {
      await connection.query(
        `UPDATE agents SET agency_name = ?, bio = ?, years_experience = ?, whatsapp = ?, rating = ?, review_count = ? WHERE id = ?`,
        [agent.agencyName, agent.bio, agent.yearsExperience, agent.whatsapp, agent.rating, agent.reviewCount, existingAgent.id]
      );
      agentIdBySeedId[agent.id] = existingAgent.id;
    } else {
      const [result] = await connection.query(
        `INSERT INTO agents (user_id, agency_name, bio, years_experience, whatsapp, rating, review_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userRow.id, agent.agencyName, agent.bio, agent.yearsExperience, agent.whatsapp, agent.rating, agent.reviewCount]
      );
      agentIdBySeedId[agent.id] = result.insertId;
    }
  }
  console.log(`  agents: ${seedAgents.length} ready`);

  // ---------- Amenities master list ----------
  for (const [i, item] of AMENITIES_CATALOG.entries()) {
    await connection.query(
      `INSERT INTO amenities (name, icon_key, category, sort_order) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE icon_key = VALUES(icon_key), category = VALUES(category)`,
      [item.name, item.icon_key, item.category, 20 + i]
    );
  }
  for (const [name, category] of Object.entries(LEGACY_CATEGORY_BY_NAME)) {
    await connection.query(`UPDATE amenities SET category = ? WHERE name = ?`, [category, name]);
  }
  console.log(`  amenities: ${AMENITIES_CATALOG.length} catalog entries synced`);

  const [amenityRows] = await connection.query("SELECT name, category FROM amenities ORDER BY sort_order ASC, id ASC");
  const amenitiesByCategory = {};
  for (const row of amenityRows) {
    const cat = row.category || "other";
    (amenitiesByCategory[cat] ||= []).push(row.name);
  }

  // ---------- Properties ----------
  let inserted = 0;
  let updated = 0;
  for (const [index, p] of seedProperties.entries()) {
    const propertyType = PROPERTY_TYPE_MAP[p.propertyType.toLowerCase()] || "apartment";
    const subcategory = subcategoryBySlug[SUBCATEGORY_SLUG_BY_TYPE[p.propertyType.toLowerCase()] || "apartment"];
    const locationId = locationIdByCity[p.city] || null;
    const agentId = agentIdBySeedId[p.agentId] || null;
    const areaSqm = parseAreaSqm(p.area);

    const row = {
      title: p.title,
      slug: p.slug,
      description: p.description || "",
      listing_type: p.listingType,
      property_type: propertyType,
      category_id: subcategory?.category_id || null,
      subcategory_id: subcategory?.id || null,
      price: p.priceValue,
      price_period: parsePricePeriod(p.price),
      bedrooms: p.bedrooms || 0,
      bathrooms: p.bathrooms || 0,
      area_sqm: areaSqm,
      address: p.address || null,
      cover_image_url: p.image,
      location_id: locationId,
      status: "published",
      agent_id: agentId,
      featured: p.featured ? 1 : 0,
      ...extraDetailsFor(p, index, areaSqm),
      ...intelligenceDetailsFor(p, index, p.priceValue),
    };

    const [[existing]] = await connection.query("SELECT id FROM properties WHERE slug = ?", [row.slug]);
    let propertyId;
    if (existing) {
      await connection.query("UPDATE properties SET ? WHERE id = ?", [row, existing.id]);
      propertyId = existing.id;
      updated++;
    } else {
      const [result] = await connection.query("INSERT INTO properties SET ?", [row]);
      propertyId = result.insertId;
      inserted++;
    }

    // Amenities — replace-all, so re-running the seed stays in sync with lib/data.js.
    // Merges each listing's hand-picked lib/data.js features with a
    // deterministic spread across every amenity category, so the property
    // page's categorized amenities section has real content in every group
    // instead of just whichever 2-5 features happened to be hand-written.
    const categoriesForThisProperty =
      propertyType === "land"
        ? AMENITY_CATEGORY_ORDER.filter((c) => !LAND_EXCLUDED_CATEGORIES.has(c))
        : AMENITY_CATEGORY_ORDER;
    const extraAmenities = pickAmenities(amenitiesByCategory, categoriesForThisProperty, index, 2);
    const allFeatures = Array.from(new Set([...(p.features || []), ...extraAmenities]));

    await connection.query("DELETE FROM property_features WHERE property_id = ?", [propertyId]);
    if (allFeatures.length) {
      const values = allFeatures.map((f) => [propertyId, f]);
      await connection.query("INSERT INTO property_features (property_id, feature) VALUES ?", [values]);
    }

    // A small gallery on a handful of listings, to demo the admin's media section.
    await connection.query("DELETE FROM property_images WHERE property_id = ?", [propertyId]);
    if (index < 6) {
      const values = [p.image, ...GALLERY_EXTRAS].map((url, i) => [propertyId, url, i]);
      await connection.query("INSERT INTO property_images (property_id, image_url, sort_order) VALUES ?", [values]);
    }
  }

  console.log(`  properties: ${inserted} inserted, ${updated} updated (${seedProperties.length} total)`);
  await connection.end();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
