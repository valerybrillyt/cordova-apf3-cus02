import { BASE_DESARROLLO, BASE_PRUEBAS, prepararBase } from "./administrar.js";

await prepararBase(BASE_DESARROLLO);
await prepararBase(BASE_PRUEBAS);
console.log(`Esquema y datos ficticios aplicados en ${BASE_DESARROLLO} y ${BASE_PRUEBAS}.`);
