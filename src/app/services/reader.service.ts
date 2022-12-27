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

import {UtilsService} from './utils.service';
import {Injectable} from '@angular/core';
import {ProviderService} from './provider.service';
import {ActivatedRoute} from '@angular/router';
import {EthEvent, EventData} from '../models/event';

const pako = require('pako');
const blockies = require('blockies');


/**
 * Global constants and message texts
 */

const TIMER_FETCH_EVENTS = 2000;

const TIMER_FETCH_BLOCK_NUMBER = 1000;

const LIMIT_BLOCK = 5000;

const LIMIT_EVENTS = 5000;

/**
 * The class Reader manages the connection and loads events. With two timers
 * the current block number is loaded and all new events. The configuration is completely
 * url encoded, so the current setting of provider, contract address and abi can be
 * bookmarked. Because the abi can be larger than the url allowed, it will be compressed
 * as parameter.
 */
@Injectable({
  providedIn: 'root'
})
export class Reader {

  // Event table
  public eventsImportSuccess = false;
  public startInitial = '';
  public startBlock = '0';
  public endBlock = 'latest';
  public contract = '';
  public abi = '';
  public provider = '';
  public refresh = true;
  public skipUpdate = false;
  public abiBase64Data = '';
  public runningJobs = 0;
  public callbackUpdateUI: any;
  private imageCache = new Map<string, string>();
  private timestampCache = new Map<string, string>();
  private minerCache = new Map<string, string>();
  private isLoading = false;
  private isEndBlockNumberSet = false;
  private contractInstance: any = null;

  constructor(private route: ActivatedRoute, public entity: ProviderService) {

    this.route.queryParams.subscribe(params => {

      if (params['start']) {
        this.startBlock = params['start'];
        this.startInitial = this.startBlock;
      }

      if (params['end']) {
        this.endBlock = params['end'];
      }

      if (params['contract']) {
        this.contract = params['contract'];
      }

      if (params['abi']) {
        this.abiBase64Data = params['abi'];
      }

      if (params['provider']) {
        this.provider = params['provider'];
      }

      if (params['refresh']) {
        this.refresh = params['refresh'] === 'true';
        this.skipUpdate = params['refresh'] !== 'true';
      }

      this.createActiveContract();
      this.entity.setProvider(this.provider);
      this.fetchCurrentBlockNumber();
      this.fetchEvents();
    });

  }

  setUpdateCallback(callback: any) {
    this.callbackUpdateUI = callback;
  }

  reset() {
    EventData.clear();
    this.startBlock = this.startInitial;
    this.contractInstance = null;
  }

  setStartBlock(startBlock: string) {
    this.startBlock = startBlock;
  }

  setStartBlocktInitial(startBlock: string) {
    this.startInitial = startBlock;
  }

  setEndBlock(endBlock: string) {
    this.endBlock = endBlock;
  }

  setAbi(abi: string) {
    if (abi !== undefined) {
      this.abi = abi;
    }
    this.createActiveContract();
  }

  runLoadTable() {
    setTimeout(this.fetchCurrentBlockNumber.bind(this), 100);
    setTimeout(this.fetchEvents.bind(this), 200);

    setInterval(this.fetchCurrentBlockNumber.bind(this), TIMER_FETCH_BLOCK_NUMBER);
    setInterval(this.fetchEvents.bind(this), TIMER_FETCH_EVENTS);
  }

  fetchCurrentBlockNumber() {
    if (!this.skipUpdate && this.entity.isConnectionWorking()) {
      this.getCurrentBlockNumber();
    }
  }

  fetchEvents() {
    if (this.entity.isConnectionWorking()) {
      this.getPastEvents();
    }
  }

  /**
   * Creates the active contract based on the ABI and contract address
   *
   * The decoding of base64 is implemented here due historical reasons. The base64
   * encoding makes problems with urls send via email. Url length with hex encoding
   * is larger, but stable.
   *
   */
  createActiveContract() {

    if (this.abiBase64Data.length > 0) {

      this.abi = pako.ungzip(atob(this.abiBase64Data), {to: 'string'})
    }

    if (this.contract != undefined
      && this.contract.length > 0
      && this.abi !== undefined
      && this.abi.length > 0
    ) {
      try {
        this.contractInstance = new this.entity.web3.eth.Contract(JSON.parse(this.abi), this.contract);
      } catch (e) {
        // nothing to do
      }
    }
  }

  setContractAddress(contact: string) {
    this.contract = contact;

    if (this.contract.length > 0 && this.abi.length > 0) {
      try {
        if (typeof this.abi === "string") {
          this.contractInstance = new this.entity.web3.eth.Contract(JSON.parse(this.abi), this.contract);
        }
      } catch (e) {
        // nothing to do
      }
    }
  }

  /**
   * The current value is maybe not the lastBlock block number
   */
  getCurrentBlockNumber() {
    if (this.entity.isConnectionWorking() && !this.entity.isSyncing()) {
      this.entity.web3.eth.getBlockNumber().then((data: number) => {
        this.entity.currentBlock = data;
      });
    }
    return this.entity.currentBlock;
  }

  /**
   * Get all past events for the current contract and stores the results in the class Web3Connection
   */
  getPastEvents() {

    this.createActiveContract();

    // console.log("this.contractInstance", this.contractInstance)
    // console.log("this.startBlock", this.startBlock)
    // console.log("this.entity.currentBlock", this.entity.currentBlock)
    // console.log("this.isLoading", this.isLoading)
    // console.log("this.isEndBlockNumberSet", this.isEndBlockNumberSet)

    if (this.contractInstance === null ||                   // Just in the case there is a valid contract
      (+(this.startBlock) > +(this.entity.currentBlock)) || // Wait till start block has been reached
      this.isLoading ||                                     // No second start of readEventsRange(...)
      this.isEndBlockNumberSet                              // Call once (in the case end block has been read, there will nothing new)
    ) {
      return;
    }

    this.isLoading = true;
    const start = parseInt(this.startBlock, 10);
    const end = (this.endBlock === 'latest') ? (this.entity.currentBlock) : parseInt(this.endBlock, 10);

    // Store next block number for new events
    if (start < this.entity.currentBlock) {
      this.startBlock = '' + (end + 1);
      this.isEndBlockNumberSet = (this.endBlock !== 'latest');
      this.readEventsRange(start, end, this);
    }
    this.isLoading = false;
  }

  public getCachedTimestamp(blockNumber: string) {
    if (this.timestampCache.has(blockNumber)) {
      return this.timestampCache.get(blockNumber);
    } else {
      this.timestampCache.set(blockNumber, 'load...');
      this.entity.web3.eth.getBlock(blockNumber, false)
        .then((block: any) => {
          this.timestampCache.set(blockNumber, UtilsService.convertTimestamp(block.timestamp));
          this.minerCache.set(blockNumber, UtilsService.truncate(block.miner, 12));
          console.log('lazy load block data -> ', blockNumber, this.timestampCache.get(blockNumber))
        });
    }
    return '';
  }

  public getCachedMiner(blockNumber: string) {
    if (this.minerCache.has(blockNumber)) {
      return this.minerCache.get(blockNumber);
    } else {
      this.minerCache.set(blockNumber, 'load...');
      this.getCachedTimestamp(blockNumber);
    }
    return '';
  }

  private readEventsRange(start: number, end: number, that: this) {

    if ((end - start) > LIMIT_BLOCK) {
      const middle = Math.round((start + end) / 2);
      console.log('Block limit exceeded [' + start + '..' + end + '] ->  [' + start + '..' + middle + '] ' + 'and [' + (middle + 1) + '..' + end + ']');
      this.readEventsRange(start, middle, that);
      this.readEventsRange(middle + 1, end, that);
    } else {
      this.runningJobs += 1;
      console.log('Start job => ' + this.runningJobs);

      this.contractInstance.getPastEvents(
        'allEvents', {
          fromBlock: start,
          toBlock: end
        }, (errors: Error, events1: any) => {

          if (!errors) {
            if (events1.length > 0 && events1.length <= LIMIT_EVENTS) {
              let index = 0;
              for (const event in events1) {
                if (events1.hasOwnProperty(event)) {
                  if (index === 0) {
                    console.log('Load [' + start + '..' + end + '] -> number of imported events is ' + events1.length);
                  }
                  index++;

                  // Prepare return values for this event
                  const returnValues = events1[event].returnValues;
                  let values = '';
                  for (const key in returnValues) {
                    if (returnValues.hasOwnProperty(key)) {
                      if (isNaN(parseInt(key, 10))) {
                        values += '<b>' + key.replace('_', '') + ':</b></br>';
                      }
                      if (isNaN(parseInt(key, 10))) {
                        values += ('' + returnValues[key])
                          .replace('\n', '</br>')
                          .split(',').join('</br>') + '</br>';
                      }
                    }
                  }

                  const trxHash = events1[event].transactionHash;
                  const blockNumber = events1[event].blockNumber;
                  const eventName = events1[event].event;

                  if (typeof blockNumber !== 'undefined') {


                    // Is the image already in cache
                    if (!this.imageCache.has(eventName)) {
                      this.imageCache.set(eventName, blockies({
                        seed: eventName,
                        size: 8,
                        scale: 16
                      }).toDataURL());
                    }

                    EventData.set(blockNumber + '_' + events1[event].id,
                      new EthEvent(
                        '' + eventName,
                        '' + blockNumber,
                        '' + trxHash,
                        '' + UtilsService.break(trxHash, 33),
                        '',
                        '' + values,
                        '',
                        '',
                        '' + this.imageCache.get(eventName))
                    );

                    that.eventsImportSuccess = true;
                  }
                }
              }
              that.callbackUpdateUI();
            }
          } else {
            const middle = Math.round((start + end) / 2);
            console.log('Event limit exceeded [' + start + '..' + end + '] ->  [' + start + '..' + middle + '] ' + 'and [' + (middle + 1) + '..' + end + ']');
            this.readEventsRange(start, middle, that);
            this.readEventsRange(middle + 1, end, that);

          }
          this.runningJobs -= 1;
        }
      );
    }
  }
}
