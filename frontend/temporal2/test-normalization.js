// Test script to verify course ID normalization logic
console.log('Testing course ID normalization...');

// Simulate the normalizeCursoId function from tasks.ts
const normalizeCursoId = (cursoId) => {
  if (typeof cursoId === 'number') {
    return cursoId;
  }
  
  if (typeof cursoId === 'string') {
    // Handle numeric strings
    const numericValue = parseInt(cursoId);
    if (!isNaN(numericValue)) {
      return numericValue;
    }
    
    // Handle specific grade mappings
    const gradeMap = {
      '8vo': 8,
      '9no': 9,
      '10mo': 10,
      '11vo': 11,
      '12vo': 12
    };
    
    if (gradeMap[cursoId]) {
      return gradeMap[cursoId];
    }
  }
  
  // If no mapping found, return original value
  return cursoId;
};

// Test cases based on CourseSelection.tsx courses
const testCases = [
  '8vo',    // Should become 8
  '9no',    // Should become 9
  '10mo',   // Should become 10
  '11vo',   // Should become 11
  '12vo',   // Should become 12
  8,        // Should stay 8
  '5',      // Should become 5
  'unknown' // Should stay 'unknown'
];

console.log('Test Results:');
testCases.forEach(testCase => {
  const result = normalizeCursoId(testCase);
  console.log(`${testCase} -> ${result} (${typeof result})`);
});

// Test the specific problematic case from the user's report
console.log('\n=== Specific Case from Bug Report ===');
const problematicCase = '8vo';
const normalizedResult = normalizeCursoId(problematicCase);
console.log(`Original: ${problematicCase}`);
console.log(`Normalized: ${normalizedResult}`);
console.log(`Type: ${typeof normalizedResult}`);
console.log(`API URL would be: /api/protected/docente/tareas/${normalizedResult}`);