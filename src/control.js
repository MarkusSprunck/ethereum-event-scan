/**
 * Dependencies
 */
let ZLib = require('zlib');

/**
 * Global constants and message texts
 */
const DEFAULT_PROVIDER = "http://127.0.0.1:8545";
const TIMER_FETCH_EVENTS = 5000;
const TIMER_FETCH_BLOCK_NUMBER = 5000;
const ALERT_UNABLE_TO_PARSE_ABI = "Unable to parse ABI";


/**
 * The class Control manages the connection and loads events. With two timers the current block number is loaded and
 * all new events. The configuration is completely url encoded, so the current setting of provider, contract address
 * and abi can be bookmarked. Because the abi can be larger than the url allowed, it will be compressed as parameter.
 */
class Control {

    constructor(entity, progress_callback, url) {
        // Connection to blockchain
        this.entity = entity;
        this.progress_callback = progress_callback;

        // Parse command line
        this.serverUrl = new URL(url);
        this.refresh = (this.serverUrl.searchParams.get("refresh") === 'true');
        this.trxNumber = this.serverUrl.searchParams.get("trx") || '';
        this.blockNumber = this.serverUrl.searchParams.get("block") || '';
        this.contractAddress = this.serverUrl.searchParams.get("contract") || '';
        this.serverHost = this.serverUrl.host;

        // Defines the valid block range
        this.eventsBlockTo = this.serverUrl.searchParams.get("stop") || "latest";
        this.eventsBlockFrom = this.serverUrl.searchParams.get("start") || 0;
        this.eventsBlockFromInitial = this.eventsBlockFrom;

        // Initialize the provider
        this.provider = this.serverUrl.searchParams.get("provider") || DEFAULT_PROVIDER;
        this.entity.init(this.provider);

        // Event table
        this.getEventsSucceeded = false;
        this.getEventsProgress = 100;

        // Content of details
        this.detailsHtml = '';
        this.lastMessage = '';

        this.createActiveContract();
        this.getCurrentBlockNumber(true);

        this.fetchCurrentBlockNumber();
        this.fetchEvents();

        setTimeout(this.getPastEvents.bind(this), 10);

    }

    runLoadTable() {
        setInterval(this.fetchCurrentBlockNumber.bind(this), TIMER_FETCH_BLOCK_NUMBER);
        setInterval(this.fetchEvents.bind(this), TIMER_FETCH_EVENTS);
    }

    fetchCurrentBlockNumber() {
        if (this.refresh && this.entity.isConnectionWorking()) {
            this.getCurrentBlockNumber(this.refresh);
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
        this.abi = '[]';
        let _that = this;
        _that.AbiBase64Data = this.serverUrl.searchParams.get("abi") || '';
        if (_that.AbiBase64Data.length > 0) {
            let buf = new Buffer(_that.AbiBase64Data, 'base64');
            ZLib.unzip(buf, function (err, buffer) {
                if (!err) {
                    _that.abi = buffer.toString('utf8');
                    let address = _that.contractAddress;
                    if (address.length > 0 && _that.abi.length > 0) {
                        try {
                            let abi = JSON.parse(_that.abi);
                            _that.activeContract = new _that.entity.web3.eth.Contract(abi, address);
                        } catch (e) {
                            _that.lastMessage = ALERT_UNABLE_TO_PARSE_ABI;
                        }
                    }
                }
            });
        }
    }

    /**
     * The current value is maybe not the last block number
     */
    getCurrentBlockNumber(fetch) {
        if (fetch && this.entity.isConnectionWorking() && !this.entity.isSyncing()) {
            this.entity.web3.eth.getBlockNumber().then(data => {
                this.entity.currentBlock = data;
            });
        }
        return this.entity.currentBlock;
    }

    /**
     * Get all past events for the current contract and stores the results in the class Entity
     */
    getPastEvents() {

        // Just in the case there is a valid contract
        if (typeof this.activeContract === "undefined" || this.eventsBlockFrom > this.entity.currentBlock) {
            return;
        }

        let _that = this;
        this.activeContract.getPastEvents(
            "allEvents", {
                fromBlock: this.eventsBlockFrom,
                toBlock: this.eventsBlockTo
            }, (errors, events) => {

                if (!errors) {

                    console.log('Got ' + events.length + ' events');

                    // Process all events
                    let index = 0;
                    for (let event in events) {
                        index++;
                        _that.getEventsProgress = Math.round(100.0 / events.length * index);


                        // Prepare return values for this event
                        let returnValues = events[event].returnValues;
                        let value = "<td>";
                        for (let key in returnValues) {
                            if (returnValues.hasOwnProperty(key)) {
                                if (isNaN(parseInt(key))) {
                                    value += key.replace('_','') + '</br>';
                                }
                            }
                        }
                        value += '</td><td class="is-breakable">';
                        for (let key in returnValues) {
                            if (returnValues.hasOwnProperty(key)) {
                                if (isNaN(parseInt(key))) {
                                    value += returnValues[key].split('\n').join('</br>') + '<br/>';
                               }
                            }
                        }
                        value += "</td>";

                        const trxHash = events[event].transactionHash;
                        const blockNumber = events[event].blockNumber;
                        const eventName = events[event].event;

                        if (typeof blockNumber !== "undefined") {

                            // Store next block number for new events
                            _that.eventsBlockFrom = Math.max(events[event].blockNumber + 1, _that.eventsBlockFrom);

                            _that.progress_callback(_that.getEventsProgress);

                            let _number = _that.entity.events.length + 1;
                            _that.entity.events.unshift({
                                "number": _number,
                                "name": eventName,
                                "block": blockNumber,
                                "hash": trxHash,
                                "value": value,
                                "time": "",
                                "image": ""
                            });

                            _that.getEventsSucceeded = true;
                            _that.getCurrentBlockNumber(true);
                        }
                    }

                    console.log('Processed ' + events.length + ' events');
                }
            }
        );
    }

}


module.exports = Control;