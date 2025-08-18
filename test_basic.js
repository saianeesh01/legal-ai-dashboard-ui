console.log('🚀 Basic test starting...');

// Simple test
const testText = 'This is a test document with a date: March 15, 2024';
console.log('Test text:', testText);

// Test date extraction
const dateMatch = testText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i);
if (dateMatch) {
    console.log('✅ Date found:', dateMatch[0]);
    const date = new Date(dateMatch[0]);
    console.log('📅 Parsed date:', date.toISOString().split('T')[0]);
} else {
    console.log('❌ No date found');
}

console.log('✅ Basic test completed!');

