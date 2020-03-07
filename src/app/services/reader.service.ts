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

import {UtilsService} from './utils.service';
import {Injectable} from "@angular/core";
import {ProviderService} from "./provider.service";
import {ActivatedRoute} from "@angular/router";
import {TableComplete} from "../table/table-complete";
import {EventData} from "./event-data";

const zlib = require('zlib');
const blockies = require('blockies');

/**
 * Global constants and message texts
 */

const TIMER_FETCH_EVENTS = 5000;

const TIMER_FETCH_BLOCK_NUMBER = 5000;

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

    private imageCache = new Map<string, string>();

    // Event table
    public eventsImportSuccess = false;
    public eventsProgress = 100;

    public startInitial: string = '0';
    public startBlock: string = '0';
    public endBlock: string = 'latest';
    public contract: string = '';
    public abi: string = '';
    public provider: string = '';
    public refresh : boolean = true;

    private initReady = false;

    public abiBase64Data;

    private _contractInstance;

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
                this.createActiveContract();
            }

            if (params['provider']) {
                this.provider = params['provider'];
            }

            if (params['refresh']) {
                this.refresh = params['refresh'] === 'true';
            }

            // Initialize the provider
            this.entity.setProvider(this.provider);

            this.fetchCurrentBlockNumber();
            this.fetchEvents();
        });

    }

    reset() {
        EventData.length = 0;
        this.startBlock = this.startInitial;
    }

    runLoadTable() {
        setTimeout(this.fetchCurrentBlockNumber.bind(this), 10);
        setTimeout(this.fetchEvents.bind(this), 20);

        setInterval(this.fetchCurrentBlockNumber.bind(this), TIMER_FETCH_BLOCK_NUMBER);
        setInterval(this.fetchEvents.bind(this), TIMER_FETCH_EVENTS);
    }

    fetchCurrentBlockNumber() {
        if ((!this.initReady || this.refresh) && this.entity.isConnectionWorking()) {
            this.getCurrentBlockNumber();
        }
    }

    fetchEvents() {
        if ((!this.initReady || this.refresh) && this.entity.isConnectionWorking()) {
            this.initReady = true;
            this.getPastEvents();
        }
    }

    /**
     * Creates the active contract based on the ABI and contract address
     */
    createActiveContract() {
        if (this.abiBase64Data.length > 0) {
            let buf = new Buffer(this.abiBase64Data, 'base64');
            const _that = this;
            zlib.unzip(buf, function (err, buffer) {
                if (!err) {
                    _that.abi = buffer.toString('utf8');
                    if (_that.contract.length > 0 && _that.abi.length > 0) {
                        try {
                            _that._contractInstance = new _that.entity.web3.eth.Contract(
                                JSON.parse(_that.abi),
                                _that.contract
                            );
                        } catch (e) {
                            console.error("ALERT_UNABLE_TO_PARSE_ABI", e);
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
                this._contractInstance = new this.entity.web3.eth.Contract(
                    JSON.parse(this.abi),
                    this.contract
                );
            } catch (e) {
                console.error("ALERT_UNABLE_TO_CREATE_CONTRACT_INSTANCE", e);
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
        if (typeof this._contractInstance === 'undefined' || +(this.startBlock) > +(this.entity.currentBlock)) {
            return;
        }

        let _that = this;
        this._contractInstance.getPastEvents(
            'allEvents', {
                fromBlock: this.startBlock,
                toBlock: this.endBlock
            }, (errors, events) => {

                if (!errors) {

                    // Process all events
                    let index = 0;
                    for (let event in events) {
                        index++;
                        _that.eventsProgress = Math.round(100.0 / events.length * index);


                        // Prepare return values for this event
                        let returnValues = events[event].returnValues;
                        let keys = '';
                        for (let key in returnValues) {
                            if (returnValues.hasOwnProperty(key)) {
                                if (isNaN(parseInt(key))) {
                                    keys += key.replace('_', '') + '\n';
                                }
                            }
                        }


                        let values = '';
                        for (let key in returnValues) {
                            if (returnValues.hasOwnProperty(key)) {
                                if (isNaN(parseInt(key))) {
                                    values += returnValues[key] + '\n';
                                }
                            }
                        }

                        const trxHash = events[event].transactionHash;
                        const blockNumber = events[event].blockNumber;
                        const eventName = events[event].event;

                        if (typeof blockNumber !== 'undefined') {

                            // Store next block number for new events
                            _that.startBlock = '' + Math.max(events[event].blockNumber + 1, +(_that.startBlock));

                            // Is the image already in cache
                            if ( !this.imageCache.has(eventName) ) {
                                this.imageCache.set(eventName, blockies({
                                    seed: eventName,
                                    size: 8,
                                    scale: 16
                                }).toDataURL());
                            }

                            EventData.unshift({
                                'id': EventData.length + 1,
                                'name': eventName,
                                'block': '' + blockNumber,
                                'trxHash': trxHash,
                                'trxHashShort': UtilsService.truncate(trxHash, 12),
                                'key': keys,
                                'value': values,
                                'time': '',
                                'image': this.imageCache.get(eventName)
                            });

                            _that.eventsImportSuccess = true;
                        }
                    }
                }
            }
        );
    };

}
