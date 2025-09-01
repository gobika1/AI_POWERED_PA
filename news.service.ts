// News Service for AI Personal Assistant
// Fetches real-time news data from NewsAPI

import cacheService from './cache.service';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  content: string;
}

interface NewsResponse {
  success: boolean;
  articles?: NewsArticle[];
  error?: string;
}

class NewsService {
  private apiKey: string = '4db23a369b2d4b468f88ab27ff7c88a1'; // Replace with your NewsAPI key
  private baseUrl: string = 'https://newsapi.org/v2';

  // Get top headlines with caching
  async getTopHeadlines(query: string = 'general', country: string = 'us'): Promise<NewsArticle[]> {
    try {
      const cacheKey = `headlines_${query}_${country}`;
      
      // Check cache first
      const cachedNews = cacheService.get<NewsArticle[]>('news', cacheKey);
      if (cachedNews) {
        console.log(`Using cached news data for ${query}`);
        return cachedNews;
      }

      // If query is a category, use category endpoint
      const categories = this.getNewsCategories();
      let url: string;
      
      if (categories.includes(query.toLowerCase()) || query === 'general') {
        const category = query === 'general' ? '' : query.toLowerCase();
        url = `${this.baseUrl}/top-headlines?country=${country}&apiKey=${this.apiKey}`;
        if (category) {
          url += `&category=${category}`;
        }
      } else {
        // Use search endpoint for specific queries
        url = `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&apiKey=${this.apiKey}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('News API rate limit exceeded');
          return this.getMockNewsData();
        }
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();
      const articles = data.articles || [];
      
      // Filter out removed articles and return top 10
      const filteredArticles = articles
        .filter((article: NewsArticle) => 
          article.title && 
          article.title !== '[Removed]' && 
          article.description && 
          article.description !== '[Removed]'
        )
        .slice(0, 10);
      
      // Cache the result
      cacheService.set('news', cacheKey, filteredArticles);
      
      return filteredArticles;
    } catch (error) {
      console.error('News fetch error:', error);
      return this.getMockNewsData();
    }
  }

  // Get news by category with caching
  async getNewsByCategory(category: string, country: string = 'us'): Promise<NewsArticle[]> {
    try {
      const cacheKey = `category_${category}_${country}`;
      
      // Check cache first
      const cachedNews = cacheService.get<NewsArticle[]>('news', cacheKey);
      if (cachedNews) {
        console.log(`Using cached news data for category ${category}`);
        return cachedNews;
      }

      const response = await fetch(
        `${this.baseUrl}/top-headlines?country=${country}&category=${category}&apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          return this.getMockNewsData();
        }
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();
      const articles = data.articles || [];
      
      const filteredArticles = articles
        .filter((article: NewsArticle) => 
          article.title && article.title !== '[Removed]'
        )
        .slice(0, 10);
      
      // Cache the result
      cacheService.set('news', cacheKey, filteredArticles);
      
      return filteredArticles;
    } catch (error) {
      console.error('News fetch error:', error);
      return this.getMockNewsData();
    }
  }

  // Search news by keyword with caching
  async searchNews(query: string, language: string = 'en'): Promise<NewsArticle[]> {
    try {
      const cacheKey = `search_${query}_${language}`;
      
      // Check cache first
      const cachedNews = cacheService.get<NewsArticle[]>('news', cacheKey);
      if (cachedNews) {
        console.log(`Using cached search results for ${query}`);
        return cachedNews;
      }

      const response = await fetch(
        `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&language=${language}&sortBy=publishedAt&apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          return this.getMockNewsData();
        }
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();
      const articles = data.articles || [];
      
      const filteredArticles = articles
        .filter((article: NewsArticle) => 
          article.title && article.title !== '[Removed]'
        )
        .slice(0, 10);
      
      // Cache the result
      cacheService.set('news', cacheKey, filteredArticles);
      
      return filteredArticles;
    } catch (error) {
      console.error('News search error:', error);
      return this.getMockNewsData();
    }
  }

  // Get news by source
  async getNewsBySource(source: string): Promise<NewsArticle[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/top-headlines?sources=${source}&apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          return this.getMockNewsData();
        }
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();
      const articles = data.articles || [];
      
      return articles
        .filter((article: NewsArticle) => 
          article.title && article.title !== '[Removed]'
        )
        .slice(0, 10);
    } catch (error) {
      console.error('News fetch error:', error);
      return this.getMockNewsData();
    }
  }

  // Format news for display
  formatNewsSummary(articles: NewsArticle[], count: number = 5): string {
    if (!articles || articles.length === 0) {
      return "No news available at the moment.";
    }

    const topArticles = articles.slice(0, count);
    let summary = "📰 **Latest News Headlines:**\n\n";

    topArticles.forEach((article, index) => {
      const title = article.title.replace(/\[.*?\]/g, '').trim(); // Remove brackets
      const source = article.source.name;
      const time = this.formatTime(article.publishedAt);
      
      summary += `${index + 1}. **${title}**\n`;
      summary += `   📍 ${source} • ${time}\n\n`;
    });

    return summary;
  }

  // Format time
  formatTime(publishedAt: string): string {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }

  // Get news categories
  getNewsCategories(): string[] {
    return [
      'general',
      'business',
      'technology',
      'entertainment',
      'health',
      'science',
      'sports'
    ];
  }

  // Get category emoji
  getCategoryEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      'general': '📰',
      'business': '💼',
      'technology': '💻',
      'entertainment': '🎬',
      'health': '🏥',
      'science': '🔬',
      'sports': '⚽'
    };
    
    return emojiMap[category] || '📰';
  }

  // Get detailed news information
  getDetailedNewsInfo(articles: NewsArticle[]): string {
    if (!articles || articles.length === 0) {
      return "No news available at the moment.";
    }

    const article = articles[0]; // Get the first article
    const emoji = this.getCategoryEmoji('general');
    const title = article.title.replace(/\[.*?\]/g, '').trim();
    const description = article.description || 'No description available';
    const source = article.source.name;
    const time = this.formatTime(article.publishedAt);
    
    return `${emoji} **${title}**\n\n${description}\n\n📍 Source: ${source}\n⏰ ${time}`;
  }

  // Mock news data for demo purposes (when API key is not available)
  getMockNewsData(): NewsArticle[] {
    return [
      {
        title: "AI Technology Advances in Healthcare",
        description: "New developments in artificial intelligence are revolutionizing medical diagnosis and treatment.",
        url: "https://example.com/ai-healthcare",
        urlToImage: "https://example.com/image1.jpg",
        publishedAt: new Date().toISOString(),
        source: { name: "Tech News" },
        content: "Artificial intelligence is making significant strides in healthcare..."
      },
      {
        title: "Global Climate Summit Reaches New Agreement",
        description: "World leaders have agreed on new measures to combat climate change.",
        url: "https://example.com/climate-summit",
        urlToImage: "https://example.com/image2.jpg",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: { name: "World News" },
        content: "The global climate summit has concluded with a historic agreement..."
      },
      {
        title: "SpaceX Launches New Satellite Constellation",
        description: "SpaceX successfully launches another batch of Starlink satellites.",
        url: "https://example.com/spacex-launch",
        urlToImage: "https://example.com/image3.jpg",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: { name: "Space News" },
        content: "SpaceX has successfully launched another batch of satellites..."
      },
      {
        title: "New Electric Vehicle Battery Breakthrough",
        description: "Scientists develop battery technology that charges in minutes.",
        url: "https://example.com/ev-battery",
        urlToImage: "https://example.com/image4.jpg",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: { name: "Science Daily" },
        content: "A breakthrough in battery technology could revolutionize electric vehicles..."
      },
      {
        title: "Major Tech Company Announces New AI Assistant",
        description: "Leading technology company unveils next-generation AI assistant.",
        url: "https://example.com/ai-assistant",
        urlToImage: "https://example.com/image5.jpg",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: { name: "Tech Insider" },
        content: "A major technology company has announced its latest AI assistant..."
      }
    ];
  }

  // Get trending topics
  getTrendingTopics(): string[] {
    return [
      'artificial intelligence',
      'climate change',
      'space exploration',
      'electric vehicles',
      'renewable energy',
      'cybersecurity',
      'healthcare technology',
      'quantum computing'
    ];
  }
}

export default new NewsService();
export type { NewsArticle, NewsResponse };
