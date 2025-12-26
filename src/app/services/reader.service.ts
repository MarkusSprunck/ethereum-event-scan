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
    private imageCache = new Map<string, string>();
    private timestampCache = new Map<string, string>();
    private minerCache = new Map<string, string>();
    private isLoading = false;
    private isEndBlockNumberSet = false;
    contractInstance: any = null;
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
     * Creates the active contract based on the ABI and contract address
     *
     * The decoding of base64 is implemented here due historical reasons. The base64
     * encoding makes problems with urls send via email. Url length with hex encoding
     * is larger, but stable.
     *
     */
    createActiveContract() {
        if (this.abiBase64Data.length > 0) {
            try {
                // normalize URL-safe base64 variants
                const normalizeBase64 = (s: string) => {
                    let r = s.replace(/-/g, '+').replace(/_/g, '/');
                    while (r.length % 4 !== 0) {
                        r += '=';
                    }
                    return r;
                };

                const isHex = (s: string) => /^[0-9a-fA-F]+$/.test(s);

                const base64ToUint8 = (b64: string) => {
                    const bin = atob(b64);
                    const len = bin.length;
                    const arr = new Uint8Array(len);
                    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i) & 0xff;
                    return arr;
                };

                const hexToUint8 = (hex: string) => {
                    const len = hex.length / 2;
                    const arr = new Uint8Array(len);
                    for (let i = 0; i < len; i++) arr[i] = parseInt(hex.substring(i * 2, 2), 16);
                    return arr;
                };

                let base64 = this.abiBase64Data.trim();
                // Replace spaces (may appear if '+' was turned into space in URL) back to '+'
                base64 = base64.replace(/\s/g, '+');
                base64 = normalizeBase64(base64);

                // Try to decode base64 to Uint8Array directly
                let arr: Uint8Array | null = null;
                try {
                    arr = base64ToUint8(base64);
                } catch (err) {
                    console.warn('base64->bin failed, will try alternate decode', err);
                }

                let decodedData: string | null = null;
                if (arr) {
                    // quick header inspect
                    const b0 = arr[0] || 0;
                    const b1 = arr[1] || 0;
                    // header bytes inspected for branching; no need to keep a separate variable

                    // gzip header 0x1f 0x8b
                    if (b0 === 0x1f && b1 === 0x8b) {
                        try {
                            this.abi = JSON.stringify(JSON.parse(pako.ungzip(arr, {to: 'string'})));
                        } catch (e) {
                            // log sample bytes and decodedData preview for debugging
                            const sampleHex = Array.from(arr.slice(0, 16)).map(x => x.toString(16).padStart(2, '0')).join(' ');
                            console.error('pako.ungzip failed on Uint8Array. sampleBytes=', sampleHex, 'error=', e);
                            // try to inflate variants
                            try {
                                this.abi = pako.inflate(arr, {to: 'string'});
                            } catch (e2) {
                                console.error('inflate failed', e2);
                            }
                            try {
                                this.abi = pako.inflateRaw(arr, {to: 'string'});
                            } catch (e3) {
                                console.error('inflateRaw failed', e3);
                            }
                        }
                    } else if (b0 === 0x78 && (b1 === 0x01 || b1 === 0x9c || b1 === 0xda)) {
                        // zlib header
                        try {
                            this.abi = pako.inflate(arr, {to: 'string'});
                        } catch (e) {
                            console.error('pako.inflate failed on Uint8Array:', e);
                        }
                    } else {
                        // Not a known compressed header. Try to interpret as text
                        try {
                            decodedData = String.fromCharCode.apply(null, Array.from(arr));
                        } catch (e) {
                            // fallback building string slowly
                            decodedData = '';
                            for (let i = 0; i < arr.length; i++) decodedData += String.fromCharCode(arr[i]);
                        }
                        // log a preview for diagnosis
                        console.debug('decodedData preview (first 120 chars):', decodedData.substring(0, 120));
                    }
                }

                // If we didn't set this.abi yet, try other fallbacks
                if (!this.abi || this.abi.length === 0) {
                    // If decodedData not ready, attempt atob fallback
                    if (!decodedData) {
                        try {
                            decodedData = atob(base64);
                            console.debug('atob fallback produced preview (first 200 chars):', decodedData.substring(0, 200));
                        } catch (e) {
                            // atob may fail if base64 is not correct; try to detect hex
                            const candidate = this.abiBase64Data.replace(/^0x/, '');
                            if (isHex(candidate) && candidate.length % 2 === 0) {
                                try {
                                    arr = hexToUint8(candidate);
                                } catch (hexErr) {
                                    console.error('hex->uint8 failed', hexErr);
                                }
                            } else {
                                console.error('Failed to decode base64 and not hex; aborting');
                                this.abi = '';
                                return;
                            }
                        }
                    }

                    if (decodedData && decodedData.length > 0 && (!this.abi || this.abi.length === 0)) {
                        // If decodedData looks like JSON -> use directly
                        const firstChar = decodedData.charAt(0);
                        if (firstChar === '{' || firstChar === '[') {
                            this.abi = decodedData;
                        } else {
                            // If arr available, try decompression attempts in order
                            if (!arr && decodedData) {
                                // create arr from decodedData
                                const tmp = new Uint8Array(decodedData.length);
                                for (let i = 0; i < decodedData.length; i++) tmp[i] = decodedData.charCodeAt(i) & 0xff;
                                arr = tmp;
                            }

                            if (arr) {
                                let decompressed: string | null = null;
                                const methods = [
                                    (a: Uint8Array) => pako.ungzip(a, {to: 'string'}),
                                    (a: Uint8Array) => pako.inflate(a, {to: 'string'}),
                                    (a: Uint8Array) => pako.inflateRaw(a, {to: 'string'})
                                ];
                                let lastErr: any = null;
                                for (const m of methods) {
                                    try {
                                        const out = m(arr);
                                        if (out && out.length > 0) {
                                            decompressed = out;
                                            break;
                                        }
                                    } catch (e) {
                                        lastErr = e;
                                        console.error('decompression attempt failed:', e);
                                    }
                                }
                                if (decompressed) {
                                    this.abi = decompressed;
                                } else {
                                    // try treat decodedData as raw string JSON
                                    try {
                                        JSON.parse(decodedData);
                                        this.abi = decodedData;
                                        console.warn('ABI not compressed, using raw decodedData.');
                                    } catch (je) {
                                        console.error('All decompression attempts failed. Last error:', lastErr, 'decodedData preview:', decodedData.substring(0, 120));
                                        this.abi = '';
                                        return;
                                    }
                                }
                            } else {
                                console.error('No binary data to attempt decompression');
                                this.abi = '';
                                return;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error decoding ABI data from Base64:', error);
                this.abi = '';
                return;
            }
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
            try {
                // `abi` is typed as string in this class, drop redundant typeof check
                if (this.entity && this.entity.web3 && this.entity.web3.eth) {
                    this.contractInstance = new this.entity.web3.eth.Contract(JSON.parse(this.abi), this.contract);
                } else {
                    console.warn('Web3 provider not initialized; cannot create contract instance in setContractAddress.');
                    this.contractInstance = null;
                }
            } catch (e) {
                // nothing to do
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

    private isBlockLimitExceeded(start: number, end: number) {
        return (end > start) && ((end - start) > LIMIT_BLOCK_MIN) && ((end - start) > LIMIT_BLOCK_MAX);
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
                                values += '<b>' + key.replace('_', '') + ':</b></br>';
                                values += ('' + returnValues[key]).replace('\n', '</br>').split(',').join('</br>') + '</br>';
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

                        const eventId = blockNumber + '_' + eventsList[event].id
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
                && ((end - start) > LIMIT_BLOCK_MAX)
            ) {
                const middle = Math.round((start + end) / 2);
                console.debug('Event limit exceeded [' + start + '..' + end + '] ->  [' + start + '..' + middle + '] ' + 'and [' + (middle + 1) + '..' + end + ']');
                this.readEventsRange(start, middle, that);
                this.readEventsRange(middle + 1, end, that);
            }
        });
    }
}
