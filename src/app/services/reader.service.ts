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

import {UtilsService} from './utils.service';
import {Injectable} from '@angular/core';
import {ProviderService} from './provider.service';
import {ActivatedRoute} from '@angular/router';
import {EthEvent, EventData} from '../models/event';

const pako = require('pako');

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Upper bound for the encoded ABI taken from the URL (protects against oversized/compression-bomb input)
const MAX_ABI_INPUT_LENGTH = 200_000;
const blockies = require('blockies');


/**
 * Global constants and message texts
 */

const TIMER_FETCH_EVENTS = 2000;

const TIMER_FETCH_BLOCK_NUMBER = 1000;

const LIMIT_BLOCK_MIN = 1000;

const LIMIT_BLOCK_MAX = 100000;

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
    public startInitial = '';
    public startBlock = '';
    public endBlock = '';
    public contract = '';
    public abi = '';
    public provider = '';
    public skipUpdate = false;
    public abiBase64Data = '';
    public runningJobs = 0;
    public callbackUpdateUI: any;
    contractInstance: any = null;
    private imageCache = new Map<string, string>();
    private timestampCache = new Map<string, string>();
    private minerCache = new Map<string, string>();
    private isLoading = false;
    private isEndBlockNumberSet = false;
    private createContractAttempts = 0;
    private readonly maxCreateContractAttempts = 10;

    constructor(private route: ActivatedRoute, public entity: ProviderService) {


        this.startBlock = '0';
        this.startInitial = this.startBlock;

        this.route.queryParams.subscribe(params => {

            this.skipUpdate = true

            if (params['start'] && (params['start'] !== this.startInitial)) {
                this.startBlock = params['start'];
                this.startInitial = params['start'];
                this.skipUpdate = false
            }

            if (params['end'] && (params['end'] !== this.endBlock)) {
                this.endBlock = params['end'];
                this.skipUpdate = false
            }

            if (params['contract'] && (params['contract'] !== this.contract)) {
                this.contract = params['contract'];
                this.skipUpdate = false
            }

            if (params['abi'] && (params['abi'] !== this.abiBase64Data)) {
                this.abiBase64Data = params['abi'];
                this.skipUpdate = false
            }

            if (params['provider'] && (params['provider'] !== this.provider)) {
                this.provider = params['provider'];
                this.skipUpdate = false
            }

            // Ensure provider is set before creating the contract instance
            this.entity.setProvider(this.provider);
            this.createActiveContract();
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
        if (this.entity.isConnectionWorking()) {
            this.getCurrentBlockNumber();
        }
    }

    fetchEvents() {
        if (!this.skipUpdate && this.entity.isConnectionWorking()) {
            this.getPastEvents();
        }
    }

    /**
     * Decodes a (URL-safe) base64 ABI that is either plain JSON, gzip, zlib or raw deflate
     * compressed. Returns an empty string if the data cannot be decoded.
     */
    private static decodeAbi(input: string): string {
        let base64 = input.trim().replace(/\s/g, '+').replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) {
            base64 += '=';
        }

        let text: string;
        try {
            text = atob(base64);
        } catch (e) {
            return '';
        }
        if (text.length === 0) {
            return '';
        }
        if (text.startsWith('{') || text.startsWith('[')) {
            return text;
        }

        const arr = Uint8Array.from(text, c => c.charCodeAt(0) & 0xff);
        if (arr[0] === 0x1f && arr[1] === 0x8b) {
            try {
                return JSON.stringify(JSON.parse(pako.ungzip(arr, {to: 'string'})));
            } catch (e) {
                // fall through to the generic attempts
            }
        }
        const isZlib = arr[0] === 0x78 && (arr[1] === 0x01 || arr[1] === 0x9c || arr[1] === 0xda);
        const methods = isZlib
            ? [pako.inflate, pako.ungzip, pako.inflateRaw]
            : [pako.ungzip, pako.inflate, pako.inflateRaw];
        for (const method of methods) {
            try {
                const out = method(arr, {to: 'string'});
                if (out && out.length > 0) {
                    return out;
                }
            } catch (e) {
                // try next method
            }
        }

        try {
            JSON.parse(text);
            return text;
        } catch (e) {
            return '';
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
        if (this.abiBase64Data.length > MAX_ABI_INPUT_LENGTH) {
            console.error('ABI parameter exceeds the maximum allowed length');
            return;
        }
        if (this.abiBase64Data.length > 0) {
            const decoded = Reader.decodeAbi(this.abiBase64Data);
            if (!decoded) {
                this.abi = '';
                return;
            }
            this.abi = decoded;
        }

        if (
            this.contract &&
            this.contract.length > 0 &&
            this.abi &&
            this.abi.length > 0
        ) {
            try {
                if (!this.entity || !this.entity.web3 || !this.entity.web3.eth) {
                    // If provider isn't ready yet, schedule a retry (avoid immediate TypeError)
                    if (this.createContractAttempts < this.maxCreateContractAttempts) {
                        this.createContractAttempts++;
                        console.warn(`Web3 provider not initialized yet; retrying createActiveContract (${this.createContractAttempts}/${this.maxCreateContractAttempts})`);
                        setTimeout(() => this.createActiveContract(), 500);
                    } else {
                        console.warn('Max attempts reached; cannot create contract instance.');
                        this.contractInstance = null;
                    }
                } else {
                    this.contractInstance = new this.entity.web3.eth.Contract(
                        JSON.parse(this.abi),
                        this.contract
                    );
                    // reset attempts on success
                    this.createContractAttempts = 0;
                }
            } catch (e) {
                console.error('Error creating contract instance:', e);
                this.contractInstance = null;
            }
        }
    }

    setContractAddress(contact: string) {
        this.contract = contact;

        if (this.contract.length > 0 && this.abi.length > 0) {
            // `abi` is typed as string in this class, drop redundant typeof check
            if (this.entity && this.entity.web3 && this.entity.web3.eth) {
                this.contractInstance = new this.entity.web3.eth.Contract(JSON.parse(this.abi), this.contract);
            } else {
                console.warn('Web3 provider not initialized; cannot create contract instance in setContractAddress.');
                this.contractInstance = null;
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
        return Number(this.entity.currentBlock);
    }

    /**
     * Get all past events for the current contract and stores the results in the class Web3Connection
     */
    getPastEvents() {

        this.createActiveContract();

        this.isEndBlockNumberSet = (this.endBlock.toUpperCase() !== 'LATEST');

        if (this.contractInstance === null ||                   // Just in the case there is a valid contract
            (+(this.startBlock) > this.getCurrentBlockNumber()) || // Wait till start block has been reached
            this.isLoading                                        // No second start of readEventsRange(...)
        ) {
            return;
        }

        this.isLoading = true;

        const start = parseInt(this.startBlock, 10);
        if (this.isEndBlockNumberSet) {
            const end = parseInt(this.endBlock, 10);
            this.readEventsRange(start, end, this);
            this.skipUpdate = true;
        } else {
            const end = this.getCurrentBlockNumber();
            this.readEventsRange(start, end, this);
            this.startBlock = '' + (end + 1);
        }

        this.isLoading = false;
    }

    public getCachedTimestamp(blockNumber: string) {
        if (this.timestampCache.has(blockNumber)) {
            return this.timestampCache.get(blockNumber);
        } else {
            this.timestampCache.set(blockNumber, 'load...');
            if (this.entity && this.entity.web3 && this.entity.web3.eth) {
                this.entity.web3.eth.getBlock(blockNumber, false)
                    .then((block: any) => {
                        this.timestampCache.set(blockNumber, UtilsService.convertTimestamp(block.timestamp));
                        this.minerCache.set(blockNumber, UtilsService.truncate(block.miner, 12));
                        console.debug('lazy load block data -> ', blockNumber, this.timestampCache.get(blockNumber))
                    }).catch((err: any) => {
                    console.error('Error loading block data for timestamp cache:', err);
                    this.timestampCache.set(blockNumber, 'n.a.');
                    this.minerCache.set(blockNumber, 'n.a.');
                });
            } else {
                console.warn('Web3 not available for getCachedTimestamp');
                this.timestampCache.set(blockNumber, 'n.a.');
            }
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

    readEventsRange(start: number, end: number, that: this) {

        if (that.isBlockLimitExceeded(start, end)) {
            const middle = Math.round((start + end) / 2);
            console.debug('Block limit exceeded [' + start + '..' + end + '] ->  [' + start + '..' + middle + '] ' + 'and [' + (middle + 1) + '..' + end + ']');
            this.readEventsRange(start, middle, that);
            this.readEventsRange(middle + 1, end, that);
            return
        }

        // Start new job
        this.runningJobs += 1;
        console.debug('Start job [' + start + '..' + end + '] => #' + this.runningJobs);

        // Some web3 definitions may not expose a Promise-typed overload; coerce to any to allow .then/.catch usage
        (this.contractInstance.getPastEvents as any)('allEvents', {
            fromBlock: start,
            toBlock: end
        }).then((eventsList: any) => {

            // Finish job
            this.runningJobs -= 1;

            // Everything is ok so far, so proceed to parse event list
            console.debug('Load [' + start + '..' + end + '] -> number of imported events is ' + eventsList.length);
            for (const event in eventsList) {
                if (eventsList.hasOwnProperty(event)) {

                    // Prepare return values for this event
                    const returnValues = eventsList[event].returnValues;
                    let values = '';
                    for (const key in returnValues) {
                        if (returnValues.hasOwnProperty(key)) {
                            if (isNaN(parseInt(key, 10)) && (key !== '__length__')) {
                                // chain data is untrusted: escape before adding markup
                                values += '<b>' + escapeHtml(key.replace('_', '')) + ':</b></br>';
                                values += escapeHtml('' + returnValues[key]).replace('\n', '</br>').split(',').join('</br>') + '</br>';
                            }
                        }
                    }
                    const trxHash = eventsList[event].transactionHash;
                    const eventName = eventsList[event].event;
                    const blockNumber = eventsList[event].blockNumber;

                    if (typeof blockNumber !== 'undefined') {

                        // check if image is already in cache
                        if (!this.imageCache.has(eventName)) {
                            this.imageCache.set(eventName, blockies({
                                seed: eventName,
                                size: 8,
                                scale: 16
                            }).toDataURL());
                        }

                        // web3 v4 events have no 'id'; transactionHash + logIndex identifies a log uniquely
                        const eventId = blockNumber + '_' + trxHash + '_' + eventsList[event].logIndex
                        const img = this.imageCache.has(eventName) ? (this.imageCache.get(eventName) as string) : '';
                        EventData.set(
                            eventId,
                            new EthEvent(
                                '' + eventName,
                                '' + blockNumber,
                                '' + trxHash,
                                '' + UtilsService.break(trxHash, 33), '',
                                '' + values, '', '',
                                img
                            )
                        );
                    }
                }
            }
            that.callbackUpdateUI();
        }).catch((errors: Error) => {

            // Finish job
            this.runningJobs -= 1;

            // Log unexpected errors to console.error so tests watching for errors pick them up
            console.error('Error in allEvents: ' + errors)
            if (errors.message === 'Returned error: query returned more than 10000 results'
                && (end > start)
                && ((end - start) > LIMIT_BLOCK_MIN)
            ) {
                const middle = Math.round((start + end) / 2);
                console.debug('Event limit exceeded [' + start + '..' + end + '] ->  [' + start + '..' + middle + '] ' + 'and [' + (middle + 1) + '..' + end + ']');
                this.readEventsRange(start, middle, that);
                this.readEventsRange(middle + 1, end, that);
            }
        });
    }

    private isBlockLimitExceeded(start: number, end: number) {
        return (end > start) && ((end - start) > LIMIT_BLOCK_MAX);
    }
}
