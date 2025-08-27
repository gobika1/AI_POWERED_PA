# 🌤️ Weather Setup Guide

This guide will help you set up real-time weather functionality for your AI Personal Assistant app.

## 📋 Prerequisites

1. **OpenWeatherMap Account**: You'll need a free account at [OpenWeatherMap](https://openweathermap.org/)
2. **API Key**: Get your free API key from the OpenWeatherMap dashboard

## 🚀 Setup Steps

### 1. Create OpenWeatherMap Account

1. Go to [OpenWeatherMap](https://openweathermap.org/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### 2. Get Your API Key

1. Log in to your OpenWeatherMap account
2. Go to "My API Keys" in your profile
3. Copy your default API key (or create a new one)
4. **Note**: New API keys may take a few hours to activate

### 3. Update Your Weather Service

1. Open `weather.service.ts`
2. Replace `YOUR_OPENWEATHERMAP_API_KEY` with your actual API key:

```typescript
private apiKey: string = 'your_actual_api_key_here';
```

### 4. Test the Weather Functionality

1. Run your app
2. Ask the AI assistant: "What's the weather?"
3. Tap the weather display in the header to refresh
4. Try voice commands: "Tell me the weather"

## 🌍 Available Weather Features

### Current Weather
- Temperature (current and feels like)
- Weather description
- Humidity percentage
- Wind speed
- City and country
- Weather emoji

### Weather Commands
- **Text**: "What's the weather?" or "weather"
- **Voice**: "Tell me the weather" or "What's the weather like?"
- **Tap**: Tap the weather display in the header to refresh

### Weather Display
- **Header**: Shows current weather with emoji
- **Chat**: Detailed weather information when requested
- **Auto-refresh**: Weather updates when you tap the header

## 🔧 Customization Options

### Change Default City

In `App.tsx`, find this line and change the city:

```typescript
const weatherResponse = await weatherService.getCurrentWeather('New York');
```

Replace 'New York' with your preferred city.

### Add Location Services

To use the user's current location instead of a fixed city:

1. Install location permissions:
```bash
npm install @react-native-community/geolocation
```

2. Update the weather service to use coordinates:
```typescript
// Get user's location and fetch weather
const weatherResponse = await weatherService.getWeatherByLocation(lat, lon);
```

### Weather Units

The app uses metric units (Celsius, km/h). To change to imperial:

1. Update the API call in `weather.service.ts`:
```typescript
// Change from metric to imperial
&units=imperial
```

2. Update the display formatting accordingly.

## 🆘 Troubleshooting

### API Key Issues
- **Error**: "Weather API error: 401"
- **Solution**: Check your API key and ensure it's activated (may take 2 hours)

### Network Issues
- **Error**: "Failed to fetch weather data"
- **Solution**: Check internet connection and API endpoint availability

### Fallback Mode
If the weather API fails, the app will use mock data:
- Temperature: 22°C
- Description: "partly cloudy"
- City: "New York"

## 📱 Weather Commands in Chat

Your AI assistant can now handle these weather-related queries:

- "What's the weather?"
- "Tell me the weather"
- "Weather forecast"
- "How's the weather today?"
- "Weather update"

## 🎯 Voice Commands

Try these voice commands for weather:

- "What's the weather like?"
- "Tell me the current weather"
- "Weather forecast for tomorrow"
- "How hot is it today?"

## 🔄 Auto-Refresh

The weather automatically refreshes when:
- App starts
- User taps the weather display in header
- User asks for weather information

## 📊 Weather Data Structure

The weather service provides:

```typescript
interface WeatherData {
  temperature: number;      // Current temperature in Celsius
  description: string;      // Weather description
  humidity: number;         // Humidity percentage
  windSpeed: number;        // Wind speed in km/h
  city: string;            // City name
  country: string;         // Country code
  icon: string;            // Weather icon code
  feelsLike: number;       // Feels like temperature
  pressure: number;        // Atmospheric pressure
  visibility: number;      // Visibility in km
}
```

## 🎨 Weather Emojis

The app automatically shows weather-appropriate emojis:
- ☀️ Clear sky
- ⛅ Few clouds
- ☁️ Cloudy
- 🌧️ Rain
- ⛈️ Thunderstorm
- 🌨️ Snow
- 🌫️ Mist

---

**🌤️ Your AI Personal Assistant now has real-time weather capabilities!**
