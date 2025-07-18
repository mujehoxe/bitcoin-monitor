// Test script to verify RSS parsing fixes
console.log('🔍 Testing RSS parsing fixes...\n');

// Test CDATA parsing
function extractXMLContent(xmlText, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xmlText.match(regex);
  
  if (!match) return null;
  
  let content = match[1].trim();
  
  // Handle CDATA sections
  const cdataRegex = /^<!\[CDATA\[([\s\S]*?)\]\]>$/;
  const cdataMatch = content.match(cdataRegex);
  if (cdataMatch) {
    content = cdataMatch[1];
  }
  
  return content;
}

// Test cases
const testCases = [
  {
    name: 'Cointelegraph CDATA title',
    xml: '<title><![CDATA[ Outrage as $1.8B "DGCX" crypto scam ringleader mocks victims: Asia Express ]]></title>',
    expected: ' Outrage as $1.8B "DGCX" crypto scam ringleader mocks victims: Asia Express '
  },
  {
    name: 'Regular title',
    xml: '<title>Bitcoin hits new high</title>',
    expected: 'Bitcoin hits new high'
  },
  {
    name: 'CDATA description',
    xml: '<description><![CDATA[This is a test description with <strong>HTML</strong> tags]]></description>',
    expected: 'This is a test description with <strong>HTML</strong> tags'
  }
];

testCases.forEach(testCase => {
  const result = extractXMLContent(testCase.xml, testCase.name.includes('title') ? 'title' : 'description');
  const passed = result === testCase.expected;
  console.log(`${passed ? '✅' : '❌'} ${testCase.name}: ${passed ? 'PASSED' : 'FAILED'}`);
  if (!passed) {
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got: "${result}"`);
  }
});

console.log('\n🎯 CDATA parsing test completed!');
