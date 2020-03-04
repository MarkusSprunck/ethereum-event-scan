/**
 * MIT License
 *
 * Copyright (c) 2019-2020 Markus Sprunck (sprunck.markus@gmail.com)
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

const zlib = require('zlib');

/**
 * The class Utils provides methods for string manipulation
 */
export class UtilsService {

    /**
     * Creates a human readable time format
     */
    static convertTimestamp(time) {
        const d = new Date(time * 1000);
        const yy = d.getFullYear();
        const MM = ('0' + (d.getMonth() + 1)).slice(-2);
        const dd = ('0' + d.getDate()).slice(-2);
        const hh = ('0' + d.getHours()).slice(-2);
        const mm = ('0' + d.getMinutes()).slice(-2);
        const ss = ('0' + d.getSeconds()).slice(-2);
        return dd + '.' + MM + '.' + yy + ' ' + hh + ':' + mm + ':' + ss + 'h';
    }

    /**
     * Truncate middle part of string in the case it exceeds the maximum length
     */
    static truncate(str, maxLength) {
        if (str.length <= maxLength) {
            return str;
        }
        let left = Math.ceil(maxLength / 2);
        let right = str.length - Math.floor(maxLength / 2) + 2;
        return str.substr(0, left) + '…' + str.substring(right);
    }

    /**
     * Sleep time expects milliseconds
     */
    static sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    /**
     *  Replaces all spaces with non breaking spaces in html
     */
    static spaces(value) {
        return value.replace(/\s/g, '&nbsp;')
    }

    static updateURLWithCompressedAbi(oldValue: string, newValue: string) {
        let _that = this;
        zlib.deflate(oldValue, function (err, oldBuffer) {
            if (!err) {
                const oldString = encodeURIComponent(oldBuffer.toString('base64'));
                zlib.deflate(newValue, function (err, newBuffer) {
                    if (!err) {
                        const newString = encodeURIComponent(newBuffer.toString('base64'));
                        _that.updateURLParameter('abi', oldString, newString);
                    }
                });
            }
        });
    }

    static updateURLParameter(key: string, oldValue: string, newValue: string) {
        let url = (new URL(window.location.href)).search;
        if (url === "") {
            url = '?' + key + '=' + newValue;
        } else if (url.search(key + '=') > 0) {
            url = url.replace(key + '=' + oldValue, key + '=' + newValue);
        } else {
            url = url.replace('?', '?' + key + '=' + newValue + '&');
        }
        window.history.pushState('', '', url);
    }

    static fetchABIFromVerifiedContract(contract, callback) {

        let domainURLs = [
            "http://api.etherscan.io",
            "http://api-kovan.etherscan.io",
            "http://api-ropsten.etherscan.io",
            "http://api-goerli.etherscan.io",
            "http://api-rinkeby.etherscan.io",
        ];

        // try for all networks to load ABI from verified contract
        let counter = 0;
        domainURLs.forEach(function (domain) {

            setTimeout(() => {
                let xmlhttp = new XMLHttpRequest();
                xmlhttp = new XMLHttpRequest();
                xmlhttp.onreadystatechange = function () {
                    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                        if (xmlhttp.responseText.startsWith('[{')) {
                            console.log(xmlhttp.responseText);
                            callback(xmlhttp.responseText);
                        }
                    }
                };
                let url = domain + '/api?module=contract&action=getabi&format=raw&address=' + contract;
                xmlhttp.open("GET", url, true);
                xmlhttp.send();

            }, counter * 1000 + 50);

            counter++;
        })
    }

}
