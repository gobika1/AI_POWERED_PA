// Weather Service for AI Personal Assistant
// Fetches real-time weather data from OpenWeatherMap API

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
  icon: string;
  feelsLike: number;
  pressure: number;
  visibility: number;
}

interface WeatherResponse {
  success: boolean;
  data?: WeatherData;
  error?: string;
}

class WeatherService {
  private apiKey: string = 'c5ddcfcb0e08681978ca4a72e3402a88'; // Replace with your API key
  private baseUrl: string = 'https://api.openweathermap.org/data/2.5';

  // Get current weather by city name
  async getCurrentWeather(city: string): Promise<WeatherResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          temperature: Math.round(data.main.temp),
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          city: data.name,
          country: data.sys.country,
          icon: data.weather[0].icon,
          feelsLike: Math.round(data.main.feels_like),
          pressure: data.main.pressure,
          visibility: data.visibility / 1000, // Convert to km
        }
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather data'
      };
    }
  }

  // Get current weather by coordinates
  async getWeatherByLocation(lat: number, lon: number): Promise<WeatherResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          temperature: Math.round(data.main.temp),
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6),
          city: data.name,
          country: data.sys.country,
          icon: data.weather[0].icon,
          feelsLike: Math.round(data.main.feels_like),
          pressure: data.main.pressure,
          visibility: data.visibility / 1000,
        }
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather data'
      };
    }
  }

  // Get weather forecast for next 5 days
  async getWeatherForecast(city: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.list
      };
    } catch (error) {
      console.error('Weather forecast error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather forecast'
      };
    }
  }

  // Format weather data for display
  formatWeatherDisplay(weather: WeatherData): string {
    const temp = weather.temperature;
    const desc = weather.description.charAt(0).toUpperCase() + weather.description.slice(1);
    const city = weather.city;
    
    return `${temp}°C ${desc} in ${city}`;
  }

  // Get weather emoji based on weather condition
  getWeatherEmoji(icon: string): string {
    const emojiMap: { [key: string]: string } = {
      '01d': '☀️', // clear sky day
      '01n': '🌙', // clear sky night
      '02d': '⛅', // few clouds day
      '02n': '☁️', // few clouds night
      '03d': '☁️', // scattered clouds
      '03n': '☁️',
      '04d': '☁️', // broken clouds
      '04n': '☁️',
      '09d': '🌧️', // shower rain
      '09n': '🌧️',
      '10d': '🌦️', // rain day
      '10n': '🌧️', // rain night
      '11d': '⛈️', // thunderstorm
      '11n': '⛈️',
      '13d': '🌨️', // snow
      '13n': '🌨️',
      '50d': '🌫️', // mist
      '50n': '🌫️',
    };
    
    return emojiMap[icon] || '🌤️';
  }

  // Get detailed weather information
  getDetailedWeatherInfo(weather: WeatherData): string {
    const emoji = this.getWeatherEmoji(weather.icon);
    const temp = weather.temperature;
    const feelsLike = weather.feelsLike;
    const desc = weather.description;
    const humidity = weather.humidity;
    const windSpeed = weather.windSpeed;
    const city = weather.city;
    
    return `${emoji} ${temp}°C ${desc} in ${city}\nFeels like: ${feelsLike}°C\nHumidity: ${humidity}%\nWind: ${windSpeed} km/h`;
  }

  // Mock weather data for demo purposes (when API key is not available)
  getMockWeatherData(): WeatherData {
    return {
      temperature: 22,
      description: 'partly cloudy',
      humidity: 65,
      windSpeed: 12,
      city: 'New York',
      country: 'US',
      icon: '02d',
      feelsLike: 24,
      pressure: 1013,
      visibility: 10,
    };
  }
}

export default new WeatherService();
export type { WeatherData, WeatherResponse };
