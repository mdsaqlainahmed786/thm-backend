import mongoose, { Schema, Types, Document, Model } from 'mongoose';
export enum AmenityCategory {
    OTHER = "Other Facilities",
    BATHROOM = "Bathroom",
    MEDIA_AND_ENTERTAINMENT = "Media and Entertainment",
    SAFETY_AND_SECURITY = "Safety and Security",
    BEDS_AND_BLANKET = "Beds and Blanket",
    CHILDCARE = "Childcare",
    ROOM_FEATURES = "Room Features",
    POPULAR_WITH_GUESTS = "Popular with Guests",
    HIGHLIGHTED_AMENITIES = "Highlighted Amenities",
    BASIC_FACILITIES = "Basic Facilities",
    TRANSFERS = "Transfers",
    FAMILY_AND_KIDS = "Family and kids",
    FOOD_AND_DRINKS = "Food and Drinks",
    PAYMENT_SERVICES = "Payment Services",
    HEALTH_AND_WELLNESS = "Health and wellness",
    ENTERTAINMENT = "Entertainment",
    MEDIA_AND_TECHNOLOGY = "Media and technology",
    GENERAL_SERVICES = "General Services",
    BEAUTY_AND_SPA = "Beauty and Spa",
    OUTDOOR_ACTIVITIES_AND_SPORTS = "Outdoor Activities and Sports",
    INDOOR_ACTIVITIES_AND_SPORTS = "Indoor Activities and Sports",
    COMMON_AREA = "Common Area",
    SHOPPING = "Shopping",
    BUSINESS_CENTER_AND_CONFERENCES = "Business Center and Conferences",
}

export const defaultAmenity = [
    //Popular with Guests
    { name: "Wi-Fi", category: AmenityCategory.POPULAR_WITH_GUESTS },
    { name: "Room Service", category: AmenityCategory.POPULAR_WITH_GUESTS },
    { name: "Electric Kettle", category: AmenityCategory.POPULAR_WITH_GUESTS },
    { name: "Daily Housekeeping", category: AmenityCategory.POPULAR_WITH_GUESTS },
    { name: "In-room Dining", category: AmenityCategory.POPULAR_WITH_GUESTS },
    { name: "Bathroom", category: AmenityCategory.POPULAR_WITH_GUESTS },
    { name: "Iron/Ironing Board", category: AmenityCategory.POPULAR_WITH_GUESTS },
    { name: "Mineral Water", category: AmenityCategory.POPULAR_WITH_GUESTS },
    // Highlighted Amenities
    { name: "Gym", category: AmenityCategory.HIGHLIGHTED_AMENITIES },
    { name: "Swimming Pool", category: AmenityCategory.HIGHLIGHTED_AMENITIES },
    { name: "Spa", category: AmenityCategory.HIGHLIGHTED_AMENITIES },
    // { name: "Kids Play Area", category: AmenityCategory.HIGHLIGHTED_AMENITIES },
    { name: "Indoor Games", category: AmenityCategory.HIGHLIGHTED_AMENITIES },
    { name: "Restaurant", category: AmenityCategory.HIGHLIGHTED_AMENITIES },
    { name: "24-hour Room Service", category: AmenityCategory.HIGHLIGHTED_AMENITIES },
    { name: "Bar", category: AmenityCategory.HIGHLIGHTED_AMENITIES },
    { name: "Vehicle Rentals", category: AmenityCategory.HIGHLIGHTED_AMENITIES },
    // { name: "Steam and Sauna", category: AmenityCategory.HIGHLIGHTED_AMENITIES },
    // { name: "Kids' Meals", category: AmenityCategory.HIGHLIGHTED_AMENITIES },

    // Basic Facilities
    { name: "Elevator/Lift", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Newspaper", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Free Wi-Fi", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Refrigerator", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Free LAN", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Power Backup", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Housekeeping", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Umbrellas", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Air Conditioning", category: AmenityCategory.BASIC_FACILITIES },
    { name: "EV Charging Station", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Express check-in/check-out", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Smoke Detector", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Free Parking", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Ironing Service", category: AmenityCategory.BASIC_FACILITIES },
    { name: "Laundry Service", category: AmenityCategory.BASIC_FACILITIES },
    //Beds and Blanket
    { name: "Woollen Blanket", category: AmenityCategory.BEDS_AND_BLANKET },
    // Transfers
    { name: "Paid Bus Station Transfers", category: AmenityCategory.TRANSFERS },
    { name: "Paid Airport Transfers", category: AmenityCategory.TRANSFERS },
    { name: "Paid Railway Station Transfers", category: AmenityCategory.TRANSFERS },
    { name: "Free Shuttle Service", category: AmenityCategory.TRANSFERS },

    // Family and Kids
    { name: "Kids Play Area", category: AmenityCategory.FAMILY_AND_KIDS },

    // Food and Drinks
    { name: "Dining Area", category: AmenityCategory.FOOD_AND_DRINKS },
    { name: "Kids' Meals", category: AmenityCategory.FOOD_AND_DRINKS },
    // { name: "Bar", category: AmenityCategory.FOOD_AND_DRINKS },
    { name: "Barbeque", category: AmenityCategory.FOOD_AND_DRINKS },
    // { name: "Restaurant", category: AmenityCategory.FOOD_AND_DRINKS },
    { name: "Bakery", category: AmenityCategory.FOOD_AND_DRINKS },
    { name: "Cooking Class", category: AmenityCategory.FOOD_AND_DRINKS },
    { name: "Cafe", category: AmenityCategory.FOOD_AND_DRINKS },
    { name: "Coffee Shop", category: AmenityCategory.FOOD_AND_DRINKS },

    // Payment Services
    { name: "Currency Exchange", category: AmenityCategory.PAYMENT_SERVICES },

    // Safety and Security
    { name: "Electronic Keycard", category: AmenityCategory.SAFETY_AND_SECURITY },
    { name: "CCTV", category: AmenityCategory.SAFETY_AND_SECURITY },
    { name: "Safe", category: AmenityCategory.SAFETY_AND_SECURITY },
    { name: "Security alarms", category: AmenityCategory.SAFETY_AND_SECURITY },
    { name: "Fire Extinguishers", category: AmenityCategory.SAFETY_AND_SECURITY },
    { name: "Electronic Safe", category: AmenityCategory.SAFETY_AND_SECURITY },

    // Health and Wellness
    { name: "Activity Centre", category: AmenityCategory.HEALTH_AND_WELLNESS },
    // { name: "Gym", category: AmenityCategory.HEALTH_AND_WELLNESS },
    { name: "First-aid Services", category: AmenityCategory.HEALTH_AND_WELLNESS },

    // Entertainment
    { name: "Entertainment", category: AmenityCategory.ENTERTAINMENT },

    // Media and Technology
    { name: "Electrical Chargers", category: AmenityCategory.MEDIA_AND_TECHNOLOGY },
    { name: "TV", category: AmenityCategory.MEDIA_AND_TECHNOLOGY },

    // General Services
    { name: "Wake-up Call", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Medical Centre", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Doctor on Call", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Wheelchair", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Luggage Assistance", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Ticket/Tour Assistance", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Bellboy Service", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Pool/Beach towels", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Facilities for Guests with Disabilities", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Luggage Storage", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Multilingual Staff", category: AmenityCategory.GENERAL_SERVICES },
    { name: "Concierge", category: AmenityCategory.GENERAL_SERVICES },

    // Beauty and Spa
    { name: "Steam and Sauna", category: AmenityCategory.BEAUTY_AND_SPA },
    { name: "Massage", category: AmenityCategory.BEAUTY_AND_SPA },
    { name: "Spa", category: AmenityCategory.BEAUTY_AND_SPA },

    // Outdoor Activities and Sports
    { name: "Snorkelling", category: AmenityCategory.OUTDOOR_ACTIVITIES_AND_SPORTS },
    { name: "Vehicle Rentals", category: AmenityCategory.OUTDOOR_ACTIVITIES_AND_SPORTS },
    { name: "Tours and Treks", category: AmenityCategory.OUTDOOR_ACTIVITIES_AND_SPORTS },
    { name: "Beach", category: AmenityCategory.OUTDOOR_ACTIVITIES_AND_SPORTS },

    //Bathroom
    { name: "Western Toilet Seat", category: AmenityCategory.BATHROOM },
    { name: "Bathroom Phone", category: AmenityCategory.BATHROOM },
    { name: "Shower Cubicle", category: AmenityCategory.BATHROOM },
    { name: "Slippers", category: AmenityCategory.BATHROOM },
    { name: "Hot & Cold Water", category: AmenityCategory.BATHROOM },
    { name: "Weighing Scale", category: AmenityCategory.BATHROOM },
    { name: "Shaving Mirror", category: AmenityCategory.BATHROOM },
    { name: "Dustbins", category: AmenityCategory.BATHROOM },
    { name: "Shower Cap", category: AmenityCategory.BATHROOM },
    { name: "Dental Kit", category: AmenityCategory.BATHROOM },
    { name: "Hairdryer", category: AmenityCategory.BATHROOM },
    { name: "Sewing Kit", category: AmenityCategory.BATHROOM },
    { name: "Toiletries", category: AmenityCategory.BATHROOM },
    { name: "Toilet Paper", category: AmenityCategory.BATHROOM },
    { name: "Shower", category: AmenityCategory.BATHROOM },

    // Indoor Activities and Sports
    { name: "Indoor Games", category: AmenityCategory.INDOOR_ACTIVITIES_AND_SPORTS },

    // Common Area
    { name: "Seating Area", category: AmenityCategory.COMMON_AREA },
    { name: "Balcony/Terrace", category: AmenityCategory.COMMON_AREA },
    { name: "Lawn", category: AmenityCategory.COMMON_AREA },
    { name: "Living Room", category: AmenityCategory.COMMON_AREA },
    { name: "Reception", category: AmenityCategory.COMMON_AREA },
    { name: "Sun Deck", category: AmenityCategory.COMMON_AREA },
    { name: "Outdoor Furniture", category: AmenityCategory.COMMON_AREA },

    // Shopping
    { name: "Shops", category: AmenityCategory.SHOPPING },

    // Business Center and Conferences
    { name: "Printer", category: AmenityCategory.BUSINESS_CENTER_AND_CONFERENCES },
    { name: "Fax Service", category: AmenityCategory.BUSINESS_CENTER_AND_CONFERENCES },
    { name: "Photocopying", category: AmenityCategory.BUSINESS_CENTER_AND_CONFERENCES },
    { name: "Banquet", category: AmenityCategory.BUSINESS_CENTER_AND_CONFERENCES },
    { name: "Conference Room", category: AmenityCategory.BUSINESS_CENTER_AND_CONFERENCES },

    // Other Facilities
    { name: "Kid's Menu", category: AmenityCategory.OTHER },
    { name: "Sitout Area", category: AmenityCategory.OTHER },
    { name: "Valet Parking", category: AmenityCategory.OTHER },
    { name: "Carbon Monoxide Detector", category: AmenityCategory.OTHER },
    { name: "Family Rooms", category: AmenityCategory.OTHER },
    { name: "Security Guard", category: AmenityCategory.OTHER },
    { name: "Music System", category: AmenityCategory.OTHER },
    { name: "Game Room", category: AmenityCategory.OTHER },
    { name: "Kettle", category: AmenityCategory.OTHER },
    { name: "Ceiling Fan", category: AmenityCategory.OTHER },
    { name: "Jetspray", category: AmenityCategory.OTHER },

    //Room Features
    { name: "Telephone", category: AmenityCategory.ROOM_FEATURES },
    { name: "Minibar", category: AmenityCategory.ROOM_FEATURES },
    { name: "Closet", category: AmenityCategory.ROOM_FEATURES },
    { name: "Chair", category: AmenityCategory.ROOM_FEATURES },
    { name: "Work Desk", category: AmenityCategory.ROOM_FEATURES },
    { name: "Clothes Rack", category: AmenityCategory.ROOM_FEATURES },
    { name: "Sofa", category: AmenityCategory.ROOM_FEATURES },
    { name: "Charging Points", category: AmenityCategory.ROOM_FEATURES },
    { name: "Hangers", category: AmenityCategory.ROOM_FEATURES },
    { name: "Mirror", category: AmenityCategory.ROOM_FEATURES },
];


export interface IAmenity extends Document {
    isPublished: boolean;
    name: string;
    category: string;
}

const AmenitySchema: Schema = new Schema<IAmenity>(
    {
        name: {
            type: String, required: true, unique: true
        },
        isPublished: {
            type: Boolean, default: true
        },
        category: {
            type: String, enum: AmenityCategory, default: AmenityCategory.OTHER
        }
    },
    {
        timestamps: true
    }
);
AmenitySchema.set('toObject', { virtuals: true });
AmenitySchema.set('toJSON', { virtuals: true });


export interface IAmenityModel extends Model<IAmenity> {
}

const Amenity = mongoose.model<IAmenity, IAmenityModel>('Amenity', AmenitySchema);
export default Amenity;

