// src/utils/ecuador.ts
export const isValidEcuadorianCedula = (cedula: string) => {
  const c = (cedula || '').trim();
  if (!/^\d{10}$/.test(c)) return false;
  const prov = parseInt(c.slice(0,2),10);
  if (prov < 1 || prov > 24) return false;
  const t = parseInt(c[2],10);
  if (t >= 6) return false;
  let sum = 0;
  for (let i=0;i<9;i++){
    let n = parseInt(c[i],10);
    if (i%2===0){ n*=2; if(n>9) n-=9; }
    sum += n;
  }
  const dv = (Math.ceil(sum/10)*10 - sum) % 10;
  return dv === parseInt(c[9],10);
};
