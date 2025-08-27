# 📰 News Setup Guide

This guide will help you set up real-time news functionality for your AI Personal Assistant app.

## 📋 Prerequisites

1. **NewsAPI Account**: You'll need a free account at [NewsAPI](https://newsapi.org/)
2. **API Key**: Get your free API key from the NewsAPI dashboard

## 🚀 Setup Steps

### 1. Create NewsAPI Account

1. Go to [NewsAPI](https://newsapi.org/)
2. Click "Get API Key" and create a free account
3. Verify your email address

### 2. Get Your API Key

1. **Log in** to your NewsAPI account
2. Go to your **dashboard**
3. Copy your **API key** (it's a long string of letters and numbers)
4. **Note**: Free API keys have usage limits

### 3. Update Your News Service

1. Open `news.service.ts`
2. Replace `YOUR_NEWSAPI_KEY` with your actual API key:

```typescript
private apiKey: string = 'your_actual_api_key_here';
```

### 4. Test the News Functionality

1. Run your app
2. Ask the AI assistant: "What's the news?" or "Show me headlines"
3. Tap the "News" button in the header to refresh
4. Try voice commands: "Tell me the latest news"

## 📰 Available News Features

### News Categories
- **General** 📰 - Top headlines
- **Business** 💼 - Business and finance news
- **Technology** 💻 - Tech industry news
- **Entertainment** 🎬 - Entertainment and celebrity news
- **Health** 🏥 - Health and medical news
- **Science** 🔬 - Scientific discoveries
- **Sports** ⚽ - Sports news and updates

### News Commands
- **Text**: "What's the news?" or "headlines"
- **Voice**: "Tell me the latest news" or "What are the headlines?"
- **Tap**: Tap the "News" button in the header to refresh
- **Categories**: "Show me tech news" or "Business news"

### News Display
- **Header**: News button for quick access
- **Chat**: Formatted news summaries with headlines
- **Auto-refresh**: News updates when you tap the button

## 🔧 Customization Options

### Change Default Country

In `App.tsx`, find this line and change the country:

```typescript
const newsResponse = await newsService.getTopHeadlines('us');
```

Replace 'us' with your preferred country code:
- 'us' - United States
- 'gb' - United Kingdom
- 'in' - India
- 'ca' - Canada
- 'au' - Australia

### Add News Categories

To get news by specific category:

```typescript
// Get technology news
const techNews = await newsService.getNewsByCategory('technology');

// Get business news
const businessNews = await newsService.getNewsByCategory('business');
```

### Search News by Keyword

```typescript
// Search for specific topics
const searchResults = await newsService.searchNews('artificial intelligence');
```

## 🆘 Troubleshooting

### API Key Issues
- **Error**: "News API error: 401"
- **Solution**: Check your API key and ensure it's activated

### Rate Limiting
- **Error**: "News API error: 429"
- **Solution**: Free plan has 1,000 requests per day limit

### Network Issues
- **Error**: "Failed to fetch news data"
- **Solution**: Check internet connection and API endpoint availability

### Fallback Mode
If the news API fails, the app will use mock data:
- AI Technology Advances in Healthcare
- Global Climate Summit Reaches New Agreement
- SpaceX Launches New Satellite Constellation
- New Electric Vehicle Battery Breakthrough
- Major Tech Company Announces New AI Assistant

## 📱 News Commands in Chat

Your AI assistant can now handle these news-related queries:

- "What's the news?"
- "Show me headlines"
- "Latest news"
- "Tell me the news"
- "Show me tech news"
- "Business news"
- "Sports news"
- "Health news"

## 🎯 Voice Commands

Try these voice commands for news:

- "What's the latest news?"
- "Tell me the headlines"
- "Show me technology news"
- "What's happening in business?"
- "Sports news"
- "Health updates"

## 🔄 Auto-Refresh

The news automatically refreshes when:
- App starts
- User taps the "News" button in header
- User asks for news information

## 📊 News Data Structure

The news service provides:

```typescript
interface NewsArticle {
  title: string;           // Article title
  description: string;     // Article description
  url: string;            // Article URL
  urlToImage: string;     // Article image URL
  publishedAt: string;    // Publication date
  source: {
    name: string;         // News source name
  };
  content: string;        // Article content
}
```

## 🎨 News Categories with Emojis

The app automatically shows category-appropriate emojis:
- 📰 General news
- 💼 Business news
- 💻 Technology news
- 🎬 Entertainment news
- 🏥 Health news
- 🔬 Science news
- ⚽ Sports news

## 📈 Trending Topics

The app includes trending topics:
- Artificial Intelligence
- Climate Change
- Space Exploration
- Electric Vehicles
- Renewable Energy
- Cybersecurity
- Healthcare Technology
- Quantum Computing

## 🆓 Free Plan Limits

NewsAPI free plan includes:
- **1,000 API calls per day**
- **Top headlines**
- **News search**
- **Category filtering**
- **No credit card required**

## 🔍 Advanced Features

### Search by Source
```typescript
// Get news from specific sources
const sourceNews = await newsService.getNewsBySource('bbc-news');
```

### Time-based Filtering
The app shows relative time:
- "Just now" - Less than 1 hour
- "2h ago" - 2 hours ago
- "1d ago" - 1 day ago

### News Formatting
- Clean headlines (removes brackets)
- Source attribution
- Time stamps
- Formatted summaries

---

**📰 Your AI Personal Assistant now has real-time news capabilities!**
