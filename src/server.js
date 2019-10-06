/**
 * MIT License
 *
 * Copyright (c) 2019 Markus Sprunck (sprunck.markus@gmail.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const http = require('http');
const fs = require('fs');

let SERVER_PORT = 55226;
let SERVER_IP = 'localhost';
let PROVIDER = "ws://127.0.0.1:8546";

let args = process.argv.slice(2);
if (args.length === 2) {
    PROVIDER = args[0];
    SERVER_IP = args[1];
}

console.log('\nhttp://' + SERVER_IP + ':' + SERVER_PORT + '/main.html?provider=' + PROVIDER + '\n');

http.createServer(function (request, response) {
        if (request.method === 'GET') {
            try {
                const path = './dist' + request.url.split('?')[0];
                console.log(new Date().toISOString() + ' file=' + path + ' url=' + request.url);

                fs.readFile(path, function (err, data) {
                    if (path.endsWith('.js')) {
                        response.setHeader('Content-Type', 'text/javascript');
                    }
                    response.end(data);
                });
            } catch (e) {
                console.error('Error ' + e);
            }
        }
    }
).listen(SERVER_PORT);


