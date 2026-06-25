// Simple test to check if the Map.js file can be parsed
try {
  require('./src/components/Dashboard/Map.js');
  console.log('Syntax is correct');
} catch (e) {
  console.error('Syntax error:', e.message);
  console.error('Line:', e.line);
  console.error('Column:', e.column);
}
