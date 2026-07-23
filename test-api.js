const http = require('http');

http.get('http://localhost:3000/api/fotos?proveedor=BLANCA', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const results = json.data;
    
    console.log(`Total: ${results.length}`);
    const sheets = {};
    results.forEach(r => {
      sheets[r.hoja] = (sheets[r.hoja] || 0) + 1;
    });
    console.log('Resultados por hoja:', sheets);
  });
});
