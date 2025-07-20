# Dynamic Cryptocurrency Coin Selection System

## Overview
This implementation replaces hardcoded currency lists with a dynamic system that fetches coin data directly from Binance APIs and provides real-time updates via WebSocket connections.

## Key Features

### 1. Dynamic Coin Discovery
- **File**: `src/services/dynamicCoinService.ts`
- **Function**: Fetches all available USDT trading pairs from Binance exchange info
- **Caching**: 24-hour cache to avoid excessive API calls
- **Result**: Dynamic list of all available trading symbols

### 2. Hot Coins Detection (5-minute polling)
- **Update Frequency**: Every 5 minutes
- **Criteria**: 
  - High momentum (based on 5-minute and 24-hour price changes)
  - High volume (>$1M quote volume)
  - Recent acceleration (>2% in 5 minutes OR >5% in 24 hours)
- **Data Sources**: 
  - Primary: Binance 24hr ticker API
  - Secondary: 1-minute klines for 5-minute price calculation
- **Sorting**: By momentum score (combination of 5min and 24hr changes)

### 3. Stable Coins Detection (15-minute polling)
- **Update Frequency**: Every 15 minutes
- **Criteria**:
  - Positive 24hr growth (2% - 20%)
  - Controlled volatility (<10%)
  - Minimum volume (>$500k)
- **Sorting**: By 24-hour performance (highest growth first)

### 4. Enhanced Real-Time WebSocket Subscriptions
- **File**: `src/hooks/useEnhancedRealTimePrice.ts`
- **Max Subscriptions**: 20 symbols (increased from 5)
- **Features**:
  - Dynamic subscription/unsubscription
  - Priority symbol handling (selected coin gets priority)
  - Automatic reconnection on disconnection
  - Real-time price, volume, and 24hr change updates

### 5. Enhanced Data Management Hook
- **File**: `src/hooks/useEnhancedCryptoData.ts`
- **Features**:
  - Parallel polling for hot and stable coins
  - Separate loading states for each category
  - Cache management and manual refresh capabilities
  - Integration with dynamic coin service

## Implementation Details

### API Usage Pattern
1. **Symbol Discovery**: `GET https://api.binance.com/api/v3/exchangeInfo`
2. **Ticker Data**: `GET https://api.binance.com/api/v3/ticker/24hr`
3. **5-minute Data**: `GET https://api.binance.com/api/v3/klines` (1-minute intervals, last 5 candles)
4. **Real-time Updates**: `wss://stream.binance.com:9443/stream` (ticker streams)

### Smart Rate Limiting
- **Batch Processing**: 5-minute price changes fetched in batches of 10
- **Delays**: 100ms between batches to respect rate limits
- **Fallback**: Graceful degradation if API limits are hit

### Caching Strategy
- **Symbol List**: 24 hours (changes rarely)
- **Hot Coins**: 5 minutes (frequent updates needed)
- **Stable Coins**: 15 minutes (less volatile, less frequent updates)

### WebSocket Management
- **Efficient Streams**: Uses combined stream format for multiple symbols
- **Priority Handling**: Selected symbol always included in subscriptions
- **Smart Reconnection**: Maintains subscription list across reconnections
- **Memory Management**: Cleans up data for unsubscribed symbols

## Updated Components

### Dashboard.tsx
- Uses `useEnhancedCryptoData` and `useEnhancedRealTimePrice`
- Increased WebSocket subscriptions to cover more visible coins (8 hot + 4 stable)
- Selected symbol gets priority in real-time updates

### CoinSelector.tsx
- Updated sorting logic for stable coins (24hr performance first)
- Added update frequency indicators ("Updates every 5min" / "Updates every 15min")
- Improved loading states and error handling

## Benefits

1. **No Hardcoding**: All coin lists are dynamic from Binance
2. **Real-time Data**: All displayed coins get live price updates
3. **Smart Polling**: Hot coins update every 5min, stable coins every 15min
4. **Better Performance**: Efficient WebSocket usage with priority handling
5. **Scalable**: Can handle any number of available trading pairs
6. **Robust**: Multiple fallback mechanisms and error handling

## Testing
To test the implementation:
1. Start the development server: `npm run dev`
2. Check browser console for logs showing:
   - Symbol discovery process
   - Hot/stable coin detection
   - WebSocket connection status
   - Real-time price updates

## Future Enhancements
- Add support for other quote currencies (BTC, ETH, BNB)
- Implement technical indicators for better coin classification
- Add user preferences for custom filtering criteria
- Consider implementing a favorites system
