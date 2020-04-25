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
import {EthEvent, EventData} from './event';

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
    public abiBase64Data;
    public runningJobs = 0;
    public callbackUpdateUI: () => void; // { (): void; };
    private imageCache = new Map<string, string>();
    private isLoading = false;
    private contractInstance = null;

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
            }

            this.entity.setProvider(this.provider);
            this.fetchCurrentBlockNumber();
            this.fetchEvents();
        });

    }

    setUpdateCallback(callback) {
        this.callbackUpdateUI = callback;
    }

    reset() {
        EventData.clear();
        this.startBlock = this.startInitial;
        this.contractInstance = null;
    }

    setStartBlock(startBlock) {
        this.startBlock = startBlock;
    }

    setEndBlock(endBlock) {
        this.endBlock = endBlock;
    }

    setAbi(abi) {
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
        if (this.refresh && this.entity.isConnectionWorking()) {
            this.getCurrentBlockNumber();
        }
    }

    fetchEvents() {
        if (this.refresh && this.entity.isConnectionWorking()) {
            this.getPastEvents();
        }
    }

    /**
     * Creates the active contract based on the ABI and contract address
     */
    createActiveContract() {
        if (this.abiBase64Data.length > 0) {
            const buf = Buffer.from(this.abiBase64Data, 'base64');
            const that = this;
            zlib.unzip(buf, (err, buffer) => {
                if (!err) {
                    that.abi = buffer.toString('utf8');
                    if (that.contract.length > 0 && that.abi.length > 0) {
                        try {
                            that.contractInstance = new that.entity.web3.eth.Contract(
                                JSON.parse(that.abi),
                                that.contract
                            );
                        } catch (e) {
                            console.warn('ALERT_UNABLE_TO_PARSE_ABI', e.message);
                        }
                    }
                }
            });
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
                console.warn('ALERT_UNABLE_TO_CREATE_CONTRACT_INSTANCE', e.message);
            }
        }
    }

    /**
     * The current value is maybe not the lastBlock block number
     */
    getCurrentBlockNumber() {
        if (this.entity.isConnectionWorking() && !this.entity.isSyncing()) {
            this.entity.web3.eth.getBlockNumber().then(data => {
                this.entity.currentBlock = data;
            });
        }
        return this.entity.currentBlock;
    }

    /**
     * Get all past events for the current contract and stores the results in the class Web3Connection
     */
    getPastEvents() {

        // Just in the case there is a valid contract
        if (this.contractInstance === null ||
            +(this.startBlock) > +(this.entity.currentBlock) ||
            this.isLoading) {
            return;
        }

        this.isLoading = true;
        const that = this;
        const start = parseInt(this.startBlock, 10);
        const end = (this.endBlock === 'latest') ? (this.entity.currentBlock) : parseInt(this.endBlock, 10);

        // Store next block number for new events
        this.startBlock = '' + end;
        this.readEventsRange(start, end, that);
        this.isLoading = false;
    }

    private readEventsRange(start: number, end: number, that: this) {

        this.runningJobs += 1;
        this.contractInstance.getPastEvents(
            'allEvents', {
                fromBlock: start,
                toBlock: end
            }, (errors, events) => {

                if (!errors) {
                    if (events.length > 0) {
                        let index = 0;
                        for (const event in events) {
                            if (events.hasOwnProperty(event)) {
                                console.log('Load [' + start + '..' + end + '] -> events.length=' + events.length);

                                index++;

                                // Prepare return values for this event
                                const returnValues = events[event].returnValues;
                                let keys = '';
                                for (const key in returnValues) {
                                    if (returnValues.hasOwnProperty(key)) {
                                        if (isNaN(parseInt(key, 10))) {
                                            keys += key.replace('_', '') + '\n';
                                        }
                                    }
                                }

                                let values = '';
                                for (const key in returnValues) {
                                    if (returnValues.hasOwnProperty(key)) {
                                        if (isNaN(parseInt(key, 10))) {
                                            values += returnValues[key] + '\n';
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
                                            '' + keys,
                                            '' + values,
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
