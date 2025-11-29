// Test the complete flow: Frontend normalization -> Backend parsing
console.log('=== TESTING COMPLETE FLOW: "8vo" COURSE SELECTION ===\n');

// Frontend: normalizeCursoId function (from tasks.ts)
const frontendNormalizeCursoId = (cursoId) => {
  // Si ya es un número, devolverlo como string
  const asNum = parseInt(cursoId, 10);
  if (!isNaN(asNum) && asNum > 0) {
    return String(asNum);
  }
  
  // Mapeo de nombres a números
  const courseMap = {
    '8vo': '8',
    '9no': '9', 
    '10mo': '10',
    '1bgu': '11',
    '2bgu': '12',
    '3bgu': '13'
  };
  
  const normalized = courseMap[cursoId.toLowerCase()];
  if (!normalized) {
    throw new Error(`Curso inválido: ${cursoId}. Use un número (8-13) o formato válido (8vo, 9no, etc.)`);
  }
  
  return normalized;
};

// Backend: parseCourseId function (from protected.ts)
const backendParseCourseId = (cid) => {
  const asInt = parseInt(cid, 10);
  if (!isNaN(asInt)) return asInt;
  const map = {
    '8vo': 8,
    '9no': 9,
    '10mo': 10,
    '1bgu': 11,
    '2bgu': 12,
    '3bgu': 13,
  };
  return map[cid.toLowerCase()] ?? 0;
};

// Simulate the complete user flow
console.log('1. USER SELECTS: "8vo" course from CourseSelection component');
const userSelection = '8vo';

console.log('2. FRONTEND PROCESSING:');
const frontendNormalized = frontendNormalizeCursoId(userSelection);
console.log(`   - Original course ID: "${userSelection}"`);
console.log(`   - Frontend normalized: "${frontendNormalized}" (type: ${typeof frontendNormalized})`);

console.log('3. API CALL:');
const apiUrl = `/api/protected/docente/tareas/${frontendNormalized}`;
console.log(`   - API URL: ${apiUrl}`);

console.log('4. BACKEND PROCESSING:');
const backendParsed = backendParseCourseId(frontendNormalized);
console.log(`   - Backend parsed: ${backendParsed} (type: ${typeof backendParsed})`);

console.log('5. DATABASE QUERY:');
console.log(`   - WHERE course_external_id = ${backendParsed}`);

console.log('\n=== RESULT ===');
if (backendParsed > 0) {
  console.log('✅ SUCCESS: Course ID successfully processed through the complete pipeline');
  console.log(`✅ BEFORE: GET /api/docente/tareas/8vo → 404 ERROR`);
  console.log(`✅ AFTER:  GET ${apiUrl} → VALID QUERY (course_external_id = ${backendParsed})`);
} else {
  console.log('❌ FAILED: Course ID not properly processed');
}

// Test task creation flow
console.log('\n=== TASK CREATION FLOW TEST ===');
const taskData = {
  nombre: 'Test Task',
  instrucciones: 'Test instructions',
  puntuacion: 10,
  fechaVencimiento: '2025-01-15',
  cursoId: '8vo'
};

console.log('Original task data:', taskData);
const normalizedTaskData = {
  ...taskData,
  cursoId: frontendNormalizeCursoId(taskData.cursoId),
  puntuacion: Number(taskData.puntuacion)
};
console.log('Normalized for API:', normalizedTaskData);

const finalCourseId = backendParseCourseId(normalizedTaskData.cursoId);
console.log(`Backend would store with course_external_id: ${finalCourseId}`);