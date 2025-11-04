"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ceiafDb_1 = require("../ext/ceiafDb");
async function main() {
    // 1) Probar conexión
    const [versionRows] = await ceiafDb_1.ceiafPool.query('SELECT VERSION() as v');
    console.log('MySQL version:', versionRows[0].v);
    // 2) Ver tablas
    const [tables] = await ceiafDb_1.ceiafPool.query('SHOW TABLES');
    console.log('Tablas:', tables);
    // 3) Probar una tabla esperada (ajusta nombres reales)
    // Ejemplos: estudiantes, docentes, materias, cursos
    const [row1] = await ceiafDb_1.ceiafPool.query('SELECT COUNT(*) AS c FROM estudiantes');
    console.log('Total estudiantes:', row1[0].c);
    const [sample] = await ceiafDb_1.ceiafPool.query('SELECT * FROM estudiantes LIMIT 5');
    console.log('Muestra estudiantes:', sample);
}
main()
    .then(() => {
    console.log('OK: conexión y consultas a MySQL exitosas.');
    process.exit(0);
})
    .catch((err) => {
    console.error('ERROR MySQL:', err);
    process.exit(1);
});
