const http = require('http');

const host = 'localhost';
const port = 8000;

const server = http.createServer((req, res) => {
   res.setHeader('Access-Control-Allow-Origin', '*');

   if (req.method === 'POST' && req.url === '/process-api') {
      let body = '';
      req.on('data', chunk => {
         body += chunk.toString();
      });
      req.on('end', () => {
         try {
            const bufferData = Buffer.from(body);
            const decodedData = decode(bufferData.toString());

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(decodedData);
            console.log(`Processed date - ` + new Date().toTimeString());
         } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: error.message }));
            console.log(`Error: `+error.message+` - ` + new Date());
         }
      });
   } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Not found' }));
   }
});

server.listen(port, host, () => {
   console.log(`Server is running on http://${host}:${port}`);
});

let ws = null;

function decode(i) {
   var n;
   var args = {};
   var data = i.split("");
   var name = data[0];
   var prefix = name;
   var param = [name];
   var x = 256;
   o = x;
   i = 1;
   for (; i < data.length; i++) {
      n = data[i].charCodeAt(0);
      n = x > n ? data[i] : args[n] ? args[n] : prefix + name;
      param.push(n);
      name = n.charAt(0);
      args[o] = prefix + name;
      o++;
      prefix = n;
   }
   return param.join("");
}
