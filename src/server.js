////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const http = require('http');
const fs = require('fs');


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let SERVER_PORT = 55226;
let SERVER_IP = 'localhost';
let PROVIDER = "localhost:8545";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let args = process.argv.slice(2);
if (args.length === 2) {
    PROVIDER = args[0];
    SERVER_IP = args[1];
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
console.log('\nhttp://' + SERVER_IP + ':' + SERVER_PORT + '/main.html?rpc=' + PROVIDER);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
http.createServer(function (request, response) {

        if (request.method === 'GET') {

            if (request.url.startsWith("/libs")) {
                fs.readFile('.' + request.url, function (err, data) {
                    response.writeHeader(200, {"Content-Type": "application/javascript"});
                    response.end(data);
                });
            } else if (request.url.startsWith("/css")) {
                fs.readFile('.' + request.url, function (err, data) {
                    response.writeHeader(200, {"Content-Type": "text/css"});
                    response.end(data);
                });
            } else if (request.url.startsWith('/main.html')) {
                fs.readFile('./src/main.html', function (err, html) {
                    response.writeHeader(200, {"Content-Type": "text/html"});
                    response.end(html);
                });
            } else if (request.url.startsWith('/details.html')) {
                fs.readFile('./src/details.html', function (err, html) {
                    response.writeHeader(200, {"Content-Type": "text/html"});
                    response.end(html);
                });
            }
        }
    }
).listen(SERVER_PORT);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

