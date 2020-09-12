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

const zlib = require('zlib');
const blockies = require('blockies');

/**
 * Global constants and message texts
 */

const TIMER_FETCH_EVENTS = 3000;

const TIMER_FETCH_BLOCK_NUMBER = 3000;

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
    public startInitial = '0';
    public startBlock = '0';
    public endBlock = 'latest';
    public contract = '';
    public abi = '';
    public provider = '';
    public refresh = true;
    public skipUpdate = false;
    public abiBase64Data: string;
    public runningJobs = 0;
    public callbackUpdateUI: () => void; // { (): void; };
    private imageCache = new Map<string, string>();
    private timestampCache = new Map<string, string>();
    private minerCache = new Map<string, string>();
    private isLoading = false;
    private isEndBlockNumberSet = false;
    private contractInstance: any = null;

    constructor(private route: ActivatedRoute, public entity: ProviderService) {

        this.route.queryParams.subscribe(params => {

            if (params.start) {
                this.startBlock = params.start;
                this.startInitial = this.startBlock;
            }

            if (params.end) {
                this.endBlock = params.end;
            }

            if (params.contract) {
                this.contract = params.contract;
            }

            if (params.abi) {
                this.abiBase64Data = params.abi;
                this.createActiveContract();
            }

            if (params.provider) {
                this.provider = params.provider;
            }

            if (params.refresh) {
                this.refresh = params.refresh === 'true';
                this.skipUpdate = params.refresh !== 'true';
            }

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

    setEndBlock(endBlock: string) {
        this.endBlock = endBlock;
    }

    setAbi(abi: string) {
        this.abi = abi;
        this.createActiveContract();
    }

    runLoadTable() {
        setTimeout(this.fetchCurrentBlockNumber.bind(this), 10);
        setTimeout(this.fetchEvents.bind(this), 20);

        setInterval(this.fetchCurrentBlockNumber.bind(this), TIMER_FETCH_BLOCK_NUMBER);
        setInterval(this.fetchEvents.bind(this), TIMER_FETCH_EVENTS);
    }

    fetchCurrentBlockNumber() {
        if (!this.skipUpdate && this.entity.isConnectionWorking()) {
            this.getCurrentBlockNumber();
        }
    }

    fetchEvents() {
        if (!this.skipUpdate && this.entity.isConnectionWorking()) {
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
            if (!zlib.unzip(
                Buffer.from(this.abiBase64Data, 'hex'),
                this.processUnzippedABI.bind(this))) {
                zlib.unzip(
                    Buffer.from(this.abiBase64Data, 'base64'),
                    this.processUnzippedABI.bind(this));
            }
        }
    }

    setContractAddress(contact: string) {
        this.contract = contact;
        if (this.contract.length > 0 && this.abi.length > 0) {
            try {
                this.contractInstance = new this.entity.web3.eth.Contract(
                    JSON.parse(this.abi),
                    this.contract
                );
            } catch (e) {
                alert('UNABLE TO CREATE CONTRACT INSTANCE:\n' + e.message);
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


        if (this.contractInstance === null ||                   // Just in the case there is a valid contract
            +(this.startBlock) > +(this.entity.currentBlock) || // Wait till start block has been reached
            this.isLoading ||                                   // No second start of readEventsRange(...)
            this.isEndBlockNumberSet                            // Call once (in the case end block has been read, there will nothing new)
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

    private processUnzippedABI(err: Error | null, buffer: Buffer) {
        if (!err) {
            this.abi = buffer.toString('utf8');
            if (this.contract.length > 0 && this.abi.length > 0) {
                try {
                    this.contractInstance = new this.entity.web3.eth.Contract(
                        JSON.parse(this.abi),
                        this.contract
                    );
                    return true;
                } catch (e) {
                    alert('UNABLE TO PARSE ABI:\n' + e.message);
                }
            }
        }
        return false;
    }

    public getCachedTimestamp(blockNumber: string) {
        if (this.timestampCache.has(blockNumber)) {
            return this.timestampCache.get(blockNumber);
        } else {
            this.timestampCache.set(blockNumber,'load...');
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
            this.minerCache.set(blockNumber,'load...');
            this.getCachedTimestamp(blockNumber);
        }
        return '';
    }

    private readEventsRange(start: number, end: number, that: this) {

        this.runningJobs += 1;
        this.contractInstance.getPastEvents(
            'allEvents', {
                fromBlock: start,
                toBlock: end
            }, (errors: Error, events: any) => {

                if (!errors) {
                    if (events.length > 0) {
                        let index = 0;
                        for (const event in events) {
                            if (events.hasOwnProperty(event)) {
                                if (index === 0) {
                                    console.log('Load [' + start + '..' + end + '] -> number of imported events is ' + events.length);
                                }
                                index++;

                                // Prepare return values for this event
                                const returnValues = events[event].returnValues;
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

                                const trxHash = events[event].transactionHash;
                                const blockNumber = events[event].blockNumber;
                                const eventName = events[event].event;

                                if (typeof blockNumber !== 'undefined') {


                                    // Is the image already in cache
                                    if (!this.imageCache.has(eventName)) {
                                        this.imageCache.set(eventName, blockies({
                                            seed: eventName,
                                            size: 8,
                                            scale: 16
                                        }).toDataURL());
                                    }

                                    EventData.set(blockNumber + '_' + events[event].id,
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
                    this.runningJobs -= 1;
                } else {
                    this.runningJobs -= 1;

                    if (errors.message === 'Returned error: query returned more than 10000 results') {
                        const middle = Math.round((start + end) / 2);
                        console.log('Infura 10000 limit [' + start + '..' + end + '] ->  [' + start + '..' + middle + '] ' +
                            'and [' + (middle + 1) + '..' + end + ']');
                        this.readEventsRange(start, middle, that);
                        this.readEventsRange(middle + 1, end, that);
                    }
                }
            }
        );
    }
}
