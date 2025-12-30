/**
 * MIT License
 *
 * Copyright (c) 2019-2025 Markus Sprunck (sprunck.markus@gmail.com)
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
import * as zlib from 'pako';

/**
 * The class Utils provides methods for string manipulation
 */
@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  /**
   * Creates a human-readable time format
   */
  static convertTimestamp(time: number | string | bigint) {
    // Ensure we convert BigInt or string to a Number safely
    const tNum = (typeof time === 'bigint') ? Number(time) : Number(time);
    const d = new Date(tNum * 1000);
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
    return str.substring(0, left) + '…' + str.substring(right);
  }

  /**
   * Truncate middle part of string in the case it exceeds the maximum length
   */
  static break(str: string, maxLength: number) {
    if (str.length < maxLength * 2) {
      return str;
    }
    return str.substring(0, maxLength) + '\n' + str.substring(maxLength);
  }

  static updateURLWithCompressedAbi(newValue: string) {
    const urlSafe = this.compressAbiToUrlSafe(newValue);
    this.updateURLParameter('abi', urlSafe, true);
  }

  static updateURLParameter(key: string, newValue: string, appendToEnd = false) {
    // Guard for non-browser environments
    if (typeof window === 'undefined' || !('location' in window) || !('history' in window)) {
      return;
    }

    const href = new URL(window.location.href);
    if (appendToEnd && href.searchParams.has(key)) {
      href.searchParams.delete(key);
    }
    href.searchParams.set(key, newValue);
    const params = Array.from(href.searchParams.entries());

    // Desired ordering: start, end, provider (rpc), contract, abi (always at end).
    const primaryOrder = ['start', 'end', 'provider', 'contract'];
    const entriesMap = new Map(params);

    const orderedParams: [string, string][] = [];
    // add primary ordered params if present
    for (const k of primaryOrder) {
      if (entriesMap.has(k)) {
        orderedParams.push([k, entriesMap.get(k)!]);
        entriesMap.delete(k);
      }
    }

    // collect remaining params (excluding abi) in their existing order
    for (const [k, _v] of params) {
      if (k === 'abi') { continue; }
      if (!primaryOrder.includes(k)) {
        if (entriesMap.has(k)) {
          orderedParams.push([k, entriesMap.get(k)!]);
          entriesMap.delete(k);
        }
      }
    }

    // finally append abi if present so it is always last
    if (href.searchParams.has('abi')) {
      orderedParams.push(['abi', href.searchParams.get('abi') || '']);
    }

    href.search = new URLSearchParams(orderedParams).toString();
    const newUrl = href.pathname + href.search + href.hash;
    window.history.pushState({}, '', newUrl);
  }

  static removeURLParameter(key: string) {
    if (typeof window === 'undefined' || !('location' in window) || !('history' in window)) {
      return;
    }
    const href = new URL(window.location.href);
    if (href.searchParams.has(key)) {
      href.searchParams.delete(key);
      const newUrl = href.pathname + (href.searchParams.toString() ? '?' + href.searchParams.toString() : '') + href.hash;
      window.history.pushState({}, '', newUrl);
    }
  }

  /**
   * Compress and create a URL-safe string for ABI; returns the string but does not mutate the URL.
   */
  static compressAbiToUrlSafe(newValue: string): string {
    const compressed = zlib.gzip(newValue) as Uint8Array;
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < compressed.length; i += chunkSize) {
      const slice = compressed.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(slice));
    }
    const zippedStringBase64 = btoa(binary);
    return zippedStringBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /** Reload the page after a short delay so history.replaceState has applied. */
  static reloadAfterUpdate(ms: number = 50, reloadFn?: () => void) {
    if (typeof window === 'undefined' || !window || !window.location) { return; }
    setTimeout(() => {
      try {
        (reloadFn ?? (() => window.location.reload()))();
      } catch (e) {
        // swallow errors in tests
      }
    }, ms);
  }

  static fetchABIFromVerifiedContract(contract: string, callback: any) {

    const domainURLs = [
      'https://api.etherscan.io',
      'https://api-kovan.etherscan.io',
      'https://api-ropsten.etherscan.io',
      'https://api-goerli.etherscan.io',
      'https://api-rinkeby.etherscan.io',
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
   *  Replaces all spaces with non-breaking spaces in html
   */
  static spaces(value: string) {
    return value.replace(/\s/g, '&nbsp;');
  }

}
