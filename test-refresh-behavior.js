// Test to verify refresh button uses unified endpoint
console.log('🔍 Testing refresh button behavior...');

// Mock fetch to see what URLs are being called
const originalFetch = fetch;
const calledUrls = [];

window.fetch = function(url, options) {
  calledUrls.push({ url, method: options?.method || 'GET' });
  console.log('📡 Fetch called:', url, options?.method || 'GET');
  return originalFetch.apply(this, arguments);
};

// Test refresh functionality
async function testRefreshButton() {
  console.log('🔄 Testing refresh button...');
  
  // Clear previous calls
  calledUrls.length = 0;
  
  // Simulate refresh button click
  const refreshButton = document.querySelector('[data-testid="refresh-button"]');
  if (refreshButton) {
    refreshButton.click();
  } else {
    console.log('⚠️ Refresh button not found, calling refresh directly...');
    
    // Try to call refresh directly
    try {
      const response = await fetch('/api/crypto-rss?refresh=true');
      console.log('✅ Direct refresh call successful:', response.status);
    } catch (error) {
      console.error('❌ Direct refresh call failed:', error);
    }
  }
  
  // Wait a bit for async operations
  setTimeout(() => {
    console.log('\n📊 URLs called during refresh:');
    calledUrls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} ${call.url}`);
    });
    
    // Check for problematic URLs
    const problematicUrls = calledUrls.filter(call => 
      call.url.includes('cointelegraph.com') ||
      call.url.includes('bitcoinmagazine.com') ||
      call.url.includes('decrypt.co') ||
      call.url.includes('coinjournal.net') ||
      call.url.includes('binance.com/bapi/')
    );
    
    if (problematicUrls.length > 0) {
      console.log('\n⚠️ Found direct API calls (should use unified endpoint):');
      problematicUrls.forEach(call => {
        console.log(`❌ ${call.method} ${call.url}`);
      });
    } else {
      console.log('\n✅ No direct API calls found! Using unified endpoint correctly.');
    }
    
    // Restore original fetch
    window.fetch = originalFetch;
  }, 3000);
}

// Run test
testRefreshButton();
