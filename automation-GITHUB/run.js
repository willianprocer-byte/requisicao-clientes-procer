const { executar } = require('./procer');

const idArg = process.argv.indexOf('--id');
const idFiltro = idArg !== -1 ? process.argv[idArg + 1] : null;

executar({ idFiltro }).catch(err => {
  console.error(err.message);
  process.exit(1);
});
