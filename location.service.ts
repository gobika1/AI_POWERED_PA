// Location Service for AI Personal Assistant
// Handles location detection and geolocation services for React Native

// Note: This service is designed for React Native environment
// For full functionality, install @react-native-community/geolocation
// npm install @react-native-community/geolocation

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

interface LocationResponse {
  success: boolean;
  data?: LocationData;
  error?: string;
}

class LocationService {
  private cachedLocation: LocationData | null = null;
  private cacheTimestamp: number = 0;
  private cacheValidityMs: number = 5 * 60 * 1000; // 5 minutes

  // Get user's current location (React Native compatible)
  async getCurrentLocation(): Promise<LocationResponse> {
    try {
      // Check if we have cached location that's still valid
      if (this.cachedLocation && this.isCacheValid()) {
        return {
          success: true,
          data: this.cachedLocation
        };
      }

      // For React Native, we would use @react-native-community/geolocation
      // For now, return a mock location for demonstration
      console.warn('Location services not implemented for React Native in this demo');
      
      // Mock location data (you would replace this with actual geolocation)
      const mockLocationData: LocationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'US'
      };

      // Cache the mock location
      this.cachedLocation = mockLocationData;
      this.cacheTimestamp = Date.now();

      return {
        success: true,
        data: mockLocationData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown location error'
      };
    }
  }

  // Get city name from coordinates using reverse geocoding
  private async getCityFromCoordinates(lat: number, lon: number): Promise<{ city: string; country: string } | null> {
    try {
      // Using OpenWeatherMap's reverse geocoding API
      const apiKey = 'c5ddcfcb0e08681978ca4a72e3402a88'; // Same as weather service
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          city: data[0].name,
          country: data[0].country
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  // Check if cached location is still valid
  private isCacheValid(): boolean {
    return (Date.now() - this.cacheTimestamp) < this.cacheValidityMs;
  }

  // Clear location cache
  clearCache(): void {
    this.cachedLocation = null;
    this.cacheTimestamp = 0;
  }

  // Get cached location if available
  getCachedLocation(): LocationData | null {
    return this.isCacheValid() ? this.cachedLocation : null;
  }

  // Request location permission (React Native)
  async requestLocationPermission(): Promise<boolean> {
    try {
      // In React Native, you would use PermissionsAndroid for Android
      // and request location permissions through the platform APIs
      console.warn('Location permission request not implemented for React Native in this demo');
      
      // For demo purposes, assume permission is granted
      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  // Check if location services are available (React Native)
  isLocationAvailable(): boolean {
    // In React Native, you would check if geolocation module is available
    // For demo purposes, return true
    return true;
  }

  // Get location accuracy description
  getLocationAccuracyDescription(accuracy?: number): string {
    if (!accuracy) return 'Unknown accuracy';
    
    if (accuracy < 10) return 'Very high accuracy';
    if (accuracy < 50) return 'High accuracy';
    if (accuracy < 100) return 'Medium accuracy';
    if (accuracy < 500) return 'Low accuracy';
    return 'Very low accuracy';
  }

  // Format location for display
  formatLocationDisplay(location: LocationData): string {
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    }
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }
}

export default new LocationService();
export type { LocationData, LocationResponse };
