import { INDIA_GEO_DATA } from '../constants';

export const geoService = {
    /**
     * MOCK Pincode lookup logic.
     * In a real app, this would call a postal API.
     * For English Labs, we use a mapping of common industrial pincodes.
     */
    lookupPincode(pincode: string): { city: string, state: string } | null {
        const mockLookup: Record<string, { city: string, state: string }> = {
            '110001': { city: 'New Delhi', state: 'Delhi' },
            '400001': { city: 'Mumbai', state: 'Maharashtra' },
            '560001': { city: 'Bengaluru', state: 'Karnataka' },
            '600001': { city: 'Chennai', state: 'Tamil Nadu' },
            '700001': { city: 'Kolkata', state: 'West Bengal' },
            '500001': { city: 'Hyderabad', state: 'Telangana' },
            '160017': { city: 'Chandigarh', state: 'Chandigarh' },
            '160062': { city: 'Mohali', state: 'Punjab' },
            '141001': { city: 'Ludhiana', state: 'Punjab' },
            '122001': { city: 'Gurugram', state: 'Haryana' },
            '122050': { city: 'Manesar', state: 'Haryana' },
            '380001': { city: 'Ahmedabad', state: 'Gujarat' },
            '360001': { city: 'Rajkot', state: 'Gujarat' },
        };

        return mockLookup[pincode] || null;
    },

    /**
     * Infer state from city name.
     */
    inferStateFromCity(city: string): string | null {
        if (!city) return null;
        for (const stateName in INDIA_GEO_DATA) {
            if (INDIA_GEO_DATA[stateName].cities.some(c => c.toLowerCase() === city.toLowerCase())) {
                return stateName;
            }
        }
        return null;
    }
};
