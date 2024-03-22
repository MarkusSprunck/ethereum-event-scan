/**
 * MIT License
 *
 * Copyright (c) 2019-2022 Markus Sprunck (sprunck.markus@gmail.com)
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
import {
  addHexPrefix,
  defineProperties,
  ecrecover,
  fromRpcSig,
  intToBuffer,
  pubToAddress, rlphash,
  toBuffer,
  zeros
} from "ethereumjs-util";

const zlib = require('pako');

var BlockHeader = function (this: any, data: {
  parentHash: Buffer; uncleHash: Buffer; coinbase: Buffer; stateRoot: Buffer; transactionsTrie: Buffer; receiptTrie: Buffer;
  // @ts-ignore
  bloom: Buffer; difficulty: Buffer; number: Buffer; gasLimit: Buffer; gasUsed: Buffer; timestamp: Buffer; extraData: Buffer; mixHash: Buffer; nonce: Buffer;
}, opts: undefined) {

  var fields = [{
    name: 'parentHash',
    length: 32,
    default: zeros(32)
  }, {
    name: 'uncleHash'
  }, {
    name: 'coinbase',
    length: 20,
    default: zeros(20)
  }, {
    name: 'stateRoot',
    length: 32,
    default: zeros(32)
  }, {
    name: 'transactionsTrie',
    length: 32
  }, {
    name: 'receiptTrie',
    length: 32
  }, {
    name: 'bloom',
    default: zeros(256)
  }, {
    name: 'difficulty',
    default: Buffer.from([])
  }, {
    name: 'number',
    // TODO: params.homeSteadForkNumber.v left for legacy reasons, replace on future release
    default: intToBuffer(1150000)
  }, {
    name: 'gasLimit',
    default: Buffer.from('ffffffffffffff', 'hex')
  }, {
    name: 'gasUsed',
    empty: true,
    default: Buffer.from([])
  }, {
    name: 'timestamp',
    default: Buffer.from([])
  }, {
    name: 'extraData',
    allowZero: true,
    empty: true,
    default: Buffer.from([])
  }, {
    name: 'mixHash',
    default: zeros(32)
    // length: 32
  }, {
    name: 'nonce',
    default: zeros(8) // sha3(42)
  }]
  defineProperties(this, fields, data)

}

BlockHeader.prototype.hash = function () {
  return rlphash(this.raw)
}


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

  static patchMinerAccountClique(block: any) {
    if (block !== "undefined" && block.miner === '0x0000000000000000000000000000000000000000') {
      const dataBuff = toBuffer(block.extraData)
      // @ts-ignore
      const sig = fromRpcSig(dataBuff.slice(dataBuff.length - 65, dataBuff.length))
      block.extraData = '0x' + toBuffer(block.extraData).slice(0, dataBuff.length - 65).toString('hex')
      // @ts-ignore
      const headerHash = new BlockHeader({
        parentHash: toBuffer(block.parentHash),
        uncleHash: toBuffer(block.sha3Uncles),
        coinbase: toBuffer(block.miner),
        stateRoot: toBuffer(block.stateRoot),
        transactionsTrie: toBuffer(block.transactionsRoot),
        receiptTrie: toBuffer(block.receiptsRoot),
        // @ts-ignore
        bloom: toBuffer(block.logsBloom),
        difficulty: toBuffer(addHexPrefix(Number(block.difficulty).toString(16))),
        number: toBuffer(block.number),
        gasLimit: toBuffer(block.gasLimit),
        gasUsed: toBuffer(block.gasUsed),
        timestamp: toBuffer(block.timestamp),
        extraData: toBuffer(block.extraData),
        mixHash: toBuffer(block.mixHash),
        nonce: toBuffer(block.nonce)
      })
      const pub = ecrecover(toBuffer(headerHash.hash()), sig.v, sig.r, sig.s)
      block.miner = addHexPrefix(pubToAddress(pub).toString('hex'))
    }
  }

}
