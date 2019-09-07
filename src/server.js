////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const http = require('http');
const fs = require('fs');


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let SERVER_PORT = 55226;
let SERVER_IP = 'localhost';
let PROVIDER = "http://localhost:8545";

let args = process.argv.slice(2);
if (args.length === 2) {
    PROVIDER = args[0];
    SERVER_IP = args[1];
}

console.log('\nhttp://' + SERVER_IP + ':' + SERVER_PORT + '/main.html?rpc=' + PROVIDER + '\n');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
http.createServer(function (request, response) {
        if (request.method === 'GET') {
            try {
                const path = './dist' + request.url.split('?')[0];
                console.log(new Date().toISOString() + ' file=' + path + ' url=' + request.url);

                fs.readFile(path, function (err, data) {
                    response.end(data);
                });
            } catch (e) {
                console.error('Error ' + e);
            }
        }
    }
).listen(SERVER_PORT);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

