import { BASE_DESARROLLO, prepararBase } from "./administrar.js";

await prepararBase(BASE_DESARROLLO);
console.log(`Datos ficticios de demostración listos en ${BASE_DESARROLLO}.`);
