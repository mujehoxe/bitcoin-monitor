# Bitcoin Monitor with AI Sentiment Analysis

A comprehensive Bitcoin monitoring application with real-time price tracking, technical analysis, and AI-powered sentiment analysis for predictive trading insights.

## Features

### 🔥 Core Features

- **Real-time Bitcoin Price Chart** with candlestick visualization
- **Technical Analysis** with Moving Averages (MA7, MA25, MA99)
- **WebSocket Live Updates** from multiple exchanges (Binance, Bybit)
- **Historical Data Loading** with infinite scroll
- **Multi-source Data** with automatic fallback (Binance → Bybit → CoinGecko)

### 🤖 AI Sentiment Analysis

- **Real-time News Aggregation** from multiple sources
- **Generative AI Sentiment Analysis** of market news
- **Market Prediction Engine** combining sentiment + technical indicators
- **Automated Trading Signals** with risk assessment
- **Sentiment Trend Tracking** with volatility impact analysis

### 📊 Advanced Analytics

- **Market Impact Assessment** (Bullish/Bearish/Neutral)
- **Confidence Scoring** for predictions and signals
- **Risk Level Analysis** (Low/Medium/High)
- **Portfolio Allocation Suggestions**
- **Stop Loss & Take Profit Recommendations**

## Getting Started

### Prerequisites

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Configuration

For production use, configure the following environment variables in `.env.local`:

```env
NEWS_API_KEY=your_newsapi_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## Architecture

### Sentiment Analysis Pipeline

1. **News Aggregation** - Fetches from NewsAPI, CryptoPanic, and CoinTelegraph
2. **AI Processing** - Analyzes sentiment using keyword analysis (expandable to GPT/Claude)
3. **Market Impact Assessment** - Determines bullish/bearish implications
4. **Prediction Generation** - Combines sentiment with technical indicators
5. **Trading Signal Creation** - Generates actionable buy/sell/hold recommendations

### Technical Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Charts**: Lightweight Charts (TradingView)
- **AI/ML**: OpenAI SDK, Anthropic Claude (configured)
- **Data Sources**: Binance, Bybit, CoinGecko, NewsAPI, CryptoPanic
- **Real-time**: WebSocket connections

## API Integration

### Price Data Sources

- **Primary**: Binance API (most reliable)
- **Secondary**: Bybit API (fallback)
- **Tertiary**: CoinGecko API (extended history)

### News Sources

- **NewsAPI**: General cryptocurrency news
- **CryptoPanic**: Crypto-specific news aggregation
- **CoinTelegraph**: RSS feed integration

### AI Services (Production)

- **OpenAI GPT**: Advanced sentiment analysis
- **Anthropic Claude**: Alternative AI processing
- **Custom Keywords**: Fallback sentiment analysis

## Future Enhancements

### 🎯 Roadmap

- **Auto-Trading Integration** with exchange APIs
- **Advanced ML Models** for better predictions
- **Portfolio Management** with risk analytics
- **Alert System** for significant sentiment changes
- **Multi-Asset Support** (ETH, other cryptocurrencies)
- **Historical Backtesting** of predictions vs actual performance

### 🔧 Technical Improvements

- **Real-time News Processing** with WebSocket feeds
- **Advanced NLP Models** for better sentiment accuracy
- **Market Correlation Analysis** with traditional assets
- **Social Media Integration** (Twitter, Reddit sentiment)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This application is for educational and informational purposes only. The AI-generated predictions and trading signals should not be considered as financial advice. Always do your own research and consult with financial professionals before making investment decisions.
