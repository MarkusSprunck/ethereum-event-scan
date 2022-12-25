/**
 * MIT License
 *
 * Copyright (c) 2019-2020 Markus Sprunck (sprunck.markus@gmail.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {Injectable} from '@angular/core';

const zlib = require('pako');

/**
 * The class Utils provides methods for string manipulation
 */
@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  /**
   * Creates a human readable time format
   */
  static convertTimestamp(time: number) {
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
  static truncate(str: string, maxLength: number) {
    if (str.length <= maxLength) {
      return str;
    }
    const left = Math.ceil(maxLength / 2);
    const right = str.length - Math.floor(maxLength / 2) + 2;
    return str.substr(0, left) + '…' + str.substring(right);
  }

  /**
   * Truncate middle part of string in the case it exceeds the maximum length
   */
  static break(str: string, maxLength: number) {
    if (str.length < maxLength * 2) {
      return str;
    }
    return str.substr(0, maxLength) + '\n' + str.substring(maxLength);
  }

  static updateURLWithCompressedAbi(newValue: string) {
    const zippedString = zlib.gzip(newValue, {to: 'string'});
    const zippedStringBase64 = btoa(zippedString)
    this.updateURLParameter('abi', zippedStringBase64);
  }

  static updateURLParameter(key: string, newValue: string) {
    const href = new URL(window.location.href);
    href.searchParams.set(key, newValue);
    window.history.pushState('', '', href.search);
  }

  static fetchABIFromVerifiedContract(contract: string, callback: any) {

    const domainURLs = [
      'http://api.etherscan.io',
      'http://api-kovan.etherscan.io',
      'http://api-ropsten.etherscan.io',
      'http://api-goerli.etherscan.io',
      'http://api-rinkeby.etherscan.io',
    ];

    // try for all networks to load ABI from verified contract
    let counter = 0;
    domainURLs.forEach((domain) => {

      setTimeout(() => {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
          if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            if (xmlHttp.responseText.startsWith('[{')) {
              callback(xmlHttp.responseText);
            }
          }
        };
        const url = domain + '/api?module=contract&action=getabi&format=raw&address=' + contract;
        xmlHttp.open('GET', url, true);
        xmlHttp.send();

      }, counter * 1000 + 50);

      counter++;
    });
  }

  /**
   *  Replaces all spaces with non breaking spaces in html
   */
  static spaces(value: string) {
    return value.replace(/\s/g, '&nbsp;');
  }

}
