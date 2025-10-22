//Valida que un correo electrónico tenga un formato correcto
export function normalizeEmail(raw: string): string {
  return String(raw || '').trim().toLowerCase();
}

// Validación de Cédula ecuatoriana (10 dígitos, provincia 01–24, 3er díg < 6, checksum)
export function isValidEcuadorianCedula(cedulaRaw: string): boolean {
  const cedula = String(cedulaRaw).trim();
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = parseInt(cedula.slice(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercer = parseInt(cedula[2], 10);
  if (tercer >= 6) return false;

  // Checksum (módulo 10): pares + (impares*2 -9 si >9)
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let num = parseInt(cedula[i], 10);
    if (i % 2 === 0) { // posiciones impares 1,3,5... (índice 0,2,4...)
      num *= 2;
      if (num > 9) num -= 9;
    }
    suma += num;
  }
  const decenaSuperior = Math.ceil(suma / 10) * 10;
  const digitoVerificador = (decenaSuperior - suma) % 10;

  return digitoVerificador === parseInt(cedula[9], 10);
}

// Verifica que dos contraseñas coincidan
export function passwordsMatch(p1: string, p2: string): boolean {
  return String(p1 ?? '') === String(p2 ?? '');
}

// Valida que un PIN sea numérico y tenga entre 4 y 6 dígitos
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(String(pin));
}
