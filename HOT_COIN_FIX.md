# Hot Coin Detection - Improved Criteria

## Problem
Previously, the "hot coins" tab was showing coins with negative 5-minute price changes, which doesn't align with the concept of "hot" or "accelerating" coins. Users expect to see coins that are actively gaining momentum.

## Solution
Updated the hot coin detection criteria to only include coins with **positive** 5-minute acceleration:

### New Hot Coin Criteria
A coin is considered "hot" if it meets ANY of these conditions:

1. **Strong 5-minute acceleration**: > 1.5% growth in last 5 minutes
2. **Moderate 5-minute + strong 24h**: > 0.5% in 5min AND > 10% in 24h  
3. **Exceptional 24h performance**: > 15% in 24h, high volume (>2M), and non-negative 5min change

### Key Improvements

#### ✅ **Positive Growth Filter**
- Only coins with positive 5-minute changes are shown
- Eliminates confusing entries like coins with -40% (24h) but +3% (5m)

#### ✅ **Priority Sorting**
1. **Primary**: 5-minute acceleration (highest first)
2. **Secondary**: Overall momentum score (24h + 5min weighted)

#### ✅ **Momentum Calculation**
- Old: `|24h change| + |5min change| * 2`
- New: `24h change + max(5min change, 0) * 3`
- Only positive 5-minute changes contribute to momentum

#### ✅ **UI Clarity**
- Badge updated from "By 5min growth" to "Accelerating now (5min+)"
- Makes it clear these are currently accelerating coins

### Example Results
**Before Fix:**
```
LEVERTRY: -40.56% (24h), +3.54% (5m) ❌ Shows declining coin
CTRY: -31.66% (24h), +0.41% (5m)      ❌ Shows declining coin
```

**After Fix:**
```
Only coins with positive 5-minute momentum:
ENA: +10.85% (24h), +0.37% (5m)       ✅ Actually accelerating
XTZ: +38.72% (24h), -0.29% (5m)       ❌ Filtered out (negative 5m)
```

### Cache Integration
Both fresh data and cached data now apply the same positive 5-minute filter, ensuring consistency across updates.

This change makes the "hot coins" tab truly represent coins that are gaining momentum right now, rather than mixing declining coins with short-term bounces.
