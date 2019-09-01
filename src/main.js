/**
 * Load all libraries
 */
let Web3 = require('web3');             // Connect to Ethereum network
let zlib = require('zlib');             // Compression of abi file for URL parameter encoding
let blockies = require('blockies');     // Render coloured images
let $ = require("jquery");              // UI helpers
global.jQuery = $;                      // Needed to run Bootstrap with jQuery
require("bootstrap");                   // UI framework
require("twbs-pagination");             // Paginator support

/**
 * Global constants and message texts
 */
const DEFAULT_PROVIDER = "localhost:8545";
const MESSAGE_CONNECTED = 'Connected';
const MESSAGE_NOT_CONNECTED = 'Not connected';
const ALERT_UNABLE_TO_LOAD_ABI = "Unable to load ABI";
const ALERT_UNABLE_TO_GET_EVENTS = "Unable to get events";
const ALERT_ABI_IS_NOT_WELL_FORMED = "ABI is not valid";
const ALERT_INVALID_CONTRACT_ADDRESS = "Invalid contract address\n\nExpected are two characters '0x' and 40 hex digits";
const TIMER_FETCH_EVENTS = 30000;
const TIMER_FETCH_BLOCK_NUMBER = 15000;
const TIMER_UPDATE_UI_DETAILS = 500;
const TIMER_UPDATE_UI_TABLE = 2000;
const EVENT_TABLE_RECORDS_PER_PAGE = 10;


/**
 * The class Utils provides methods for string manipulation
 */
class Utils {

    /**
     * Creates a human readable time format
     */
    static convertTimestamp(time) {
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
    static truncate(str, maxLength) {
        if (str.length <= maxLength) {
            return str;
        }
        let left = Math.ceil(maxLength / 2);
        let right = str.length - Math.floor(maxLength / 2) + 1;
        return str.substr(0, left) + "…" + str.substring(right);
    }

    /**
     *  Replaces all spaces with non breaking spaces in html
     */
    static spaces(value) {
        return value.replace(/\s/g, '&nbsp;')
    }

    /**
     * Sleep time expects milliseconds
     */
    static sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

}


/**
 * The class Entity stores the connection status and all loaded events.
 */
class Entity {

    constructor() {
        this.web3 = null;
        this.events = [];
        this.currentBlock = 0;
        this.highestBlock = 0;
        this.syncing = false;
        this.connectionWorking = false;
        this.connectionMessage = MESSAGE_NOT_CONNECTED;
    }

    /**
     * Set new provider
     */
    setWeb3(web3) {
        this.web3 = web3;
    }

    /**
     * Create connection to blockchain
     * */
    init(providerUrl) {
        // Select the needed provider
        if (providerUrl.startsWith('http')) {
            this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
        } else if (providerUrl.startsWith('ws')) {
            this.web3 = new Web3(providerUrl);
        }

        // Check success
        if (this.web3 === null) {
            this.connectionMessage = MESSAGE_NOT_CONNECTED;
        }

        // Update status
        this.isConnectionWorking();
        this.isSyncing();
    }

    /**
     * The current value is maybe not the last status of syncing
     */
    isSyncing() {
        this.web3.eth.isSyncing((error, sync) => {
            if (!error) {
                if (sync) {
                    this.currentBlock = sync.currentBlock;
                    this.highestBlock = sync.highestBlock;
                    this.syncing = true;
                } else {
                    this.syncing = false;
                }
            }
        });
        return this.syncing;
    }

    /**
     * The current value is maybe not the last status of connection
     */
    isConnectionWorking() {
        this.web3.eth.net.isListening()
            .then(() => {
                this.connectionWorking = true;
                this.connectionMessage = MESSAGE_CONNECTED;
            })
            .catch(() => {
                this.connectionWorking = false;
                this.connectionMessage = MESSAGE_NOT_CONNECTED;
            });
        return this.connectionWorking;
    }

}


/**
 * The class Control manages the connection and loads events. With two timers the current block number is loaded and
 * all new events. The configuration is completely url encoded, so the current setting of provider, contract address
 * and abi can be bookmarked. Because the abi can be larger than the url allowed, it will be compressed as parameter.
 */
class Control {

    constructor(entity) {
        // Connection to blockchain
        this.entity = entity;

        // Parse command line
        this.serverUrl = new URL(window.location.href);
        this.trxNumber = this.serverUrl.searchParams.get("trx") || '';
        this.blockNumber = this.serverUrl.searchParams.get("block") || '';
        this.contractAddress = this.serverUrl.searchParams.get("contract") || '';
        this.serverHost = this.serverUrl.host;

        // Defines the valid block range
        this.eventsBlockTo = this.serverUrl.searchParams.get("stop") || 0;
        this.eventsBlockFrom = this.serverUrl.searchParams.get("start") || 0;

        // Initialize the provider
        this.provider = this.serverUrl.searchParams.get("rpc") || DEFAULT_PROVIDER;
        this.entity.init(this.provider);

        // Event table
        this.getEventsSucceeded = false;
        this.getEventsProgress = 100;
        this.elementProgress = $('.progress');

        // Content of details
        this.detailsHtml = '';

        this.firstAlert = true;

        this.createActiveContract();
        this.getCurrentBlockNumber();
    }

    runLoadTable() {
        setInterval(this.fetchCurrentBlockNumber.bind(this), TIMER_FETCH_BLOCK_NUMBER);
        setInterval(this.fetchEvents.bind(this), TIMER_FETCH_EVENTS);
    }

    fetchCurrentBlockNumber() {
        if (this.entity.isConnectionWorking()) {
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
     */
    createActiveContract() {
        try {
            this.abi = '';
            let _that = this;
            _that.AbiBase64Data = this.serverUrl.searchParams.get("abi") || '';
            if (_that.AbiBase64Data.length > 0) {
                let buf = new Buffer(_that.AbiBase64Data, 'base64');
                zlib.unzip(buf, function (err, buffer) {
                    if (!err) {
                        _that.abi = buffer.toString('utf8');

                        let address = _that.contractAddress;
                        if (address.length > 0 && _that.abi.length > 0) {
                            let abi = JSON.parse(_that.abi);
                            _that.activeContract = new _that.entity.web3.eth.Contract(abi, address);
                        }
                    }
                });
            }
        } catch (e) {
            alert(ALERT_UNABLE_TO_LOAD_ABI);
        }
    }

    /**
     * The current value is maybe not the last block number
     */
    getCurrentBlockNumber() {
        if (!this.entity.isSyncing()) {
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
            "allEvents", {fromBlock: this.eventsBlockFrom, toBlock: "latest"}, (errors, events) => {

                if (errors) {
                    if (_that.firstAlert) {
                        alert(ALERT_UNABLE_TO_GET_EVENTS + '\n' + errors.message);
                        _that.firstAlert = false;
                    }

                } else {

                    if (events.length > 0) {
                        this.elementProgress.fadeIn(500);
                    }

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
                                    value += key.replace("_", "") + '</br>';
                                }
                            }
                        }
                        value += '</td><td>';
                        for (let key in returnValues) {
                            if (returnValues.hasOwnProperty(key)) {
                                if (isNaN(parseInt(key))) {
                                    let entry = returnValues[key];
                                    if (entry.length > 66) {
                                        value += entry.replace(/(.{61})..+/, "$1...") + '</br>';
                                    } else {
                                        value += entry + '<br/>';
                                    }
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

                            $('.progress-bar').css('width', _that.getEventsProgress + '%');

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
                        } else {
                            _that.getEventsSucceeded = false;
                        }
                    }
                }
            }
        );
    }
}


/**
 * The base class Boundary and the sub-classes manage the user interface. Almost all ui related things are done here,
 * just updating of progress bar are done in class Control.  
 */
class Boundary {
    
    constructor(control) {
        this.control = control;
        this.entity = control.entity;
    }

    trxDetailLink(hash) {
        let url = 'http://' + this.control.serverHost + '/details.html?trx=' + hash + '&rpc=' + this.control.provider;
        let result = '<a class="bmd-modalLink" href=' + url + ' target="myFrame" >' + hash + '</a>';
        return result;
    }

    trxDetailLinkTruncated(hash) {
        let url = 'http://' + this.control.serverHost + '/details.html?trx=' + hash + '&rpc=' + this.control.provider;
        let result = '<a class="bmd-modalLink" href=' + url + ' target="myFrame" >' + Utils.truncate(hash, 12) + '</a>';
        return result;
    }

    blockDetailLink(block) {
        let url = 'http://' + this.control.serverHost + '/details.html?block=' + block + '&rpc=' + this.control.provider;
        let result = '<a class="bmd-modalLink" href=' + url + ' target="myFrame" >' + block + '</a>';
        return result;
    }

}

/**
 * The base class BoundaryDetails shows the details view for a block or a transaction..
 */
class BoundaryDetails extends Boundary {

    constructor(control) {
        super(control);

        this.elementDetails = document.querySelector(".detail");
        this.ready = false;

        setInterval(this.updateUI.bind(this), TIMER_UPDATE_UI_DETAILS);
    }

    /** The update will be done once. */
    updateUI() {
        if (this.control.detailsHtml.length > 0 && !this.ready) {
            this.elementDetails.innerHTML = (this.control.detailsHtml);
            this.ready = true;
        }
    }

    /** Load details view of distinct trxNumber */
    runLoadTrx() {
        let _that = this;
        this.entity.web3.eth.getTransaction(this.control.trxNumber).then(tx => {
            if (tx === null) {
                return
            }
            _that.entity.web3.eth.getTransactionReceipt(this.control.trxNumber).then(receipt => {
                _that.control.detailsHtml = _that.printTrx(tx, receipt);
            });
        });
    }

    /**
     * Load details view of distinct blockNumber
     */
    runLoadBlock() {
        let _that = this;
        this.entity.web3.eth.getBlock(this.control.blockNumber).then(block => {
            if (block === null) {
                return
            }
            _that.control.detailsHtml = _that.printBlock(block);
        });
    }

    printBlock(block) {
        // print block details
        let number = block.number;
        let numberLast = this.control.getCurrentBlockNumber();
        let child = (numberLast > number) ? this.blockDetailLink(number + 1) : 'n.a.';
        let current = this.blockDetailLink(number);
        let parent = (number > 0) ? this.blockDetailLink(number - 1) : "0";
        let result = 'BLOCK<br/><br/>'
            + Utils.spaces('Number            : ') + current + "<br/>"
            + Utils.spaces('Parent            : ') + parent + '<br/>'
            + Utils.spaces('Child             : ') + child + '<br/>'
            + Utils.spaces('Time              : ') + Utils.convertTimestamp(block.timestamp) + '<br/>'
            + Utils.spaces('Current hash      : ') + block.hash + '<br/>'
            + Utils.spaces('Sha3Uncles        : ') + block.sha3Uncles + '<br/>'
            + Utils.spaces('StateRoot         : ') + block.stateRoot + '<br/>'
            + Utils.spaces('Miner             : ') + block.miner + '<br/>'
            + Utils.spaces('ExtraData         : ') + block.extraData + '<br/>'
            + Utils.spaces('Size              : ') + block.size + '<br/>'
            + Utils.spaces('GasUsed           : ') + block.gasUsed + '<br/>'
            + Utils.spaces('TransactionsCount : ') + block.transactions.length + '<br/>';

        // print all transactions of block
        if (block.transactions.length > 0) {
            let index = 0;
            let _that = this;
            block.transactions.forEach(function (trxHash) {
                if (0 === index) {
                    result += Utils.spaces('Transactions      : ');
                    result += _that.trxDetailLink(trxHash) + '<br/>';
                } else {
                    result += Utils.spaces('                    ');
                    result += _that.trxDetailLink(trxHash) + '<br/>';
                }
                index++;
            })
        }

        return result;
    }

    printTrx(tx, receipt) {

        // Format input (in the case it is too long for one line)
        let input = "&zwj;" + tx.input;
        let width = 100;
        for (let x = 1; (width * x) <= input.length; x++) {
            input = input.slice(0, width * x) + '<br/>' + input.slice(width * x)
        }

        // Print transaction details
        let contractAddress = (receipt.contractAddress === null) ? 'n.a.' : receipt.contractAddress;
        return "Transaction<br/><br/>"
            + Utils.spaces('Hash              : ') + this.trxDetailLink(tx.hash) + '<br/>'
            + Utils.spaces('Index             : ') + tx.transactionIndex + '<br/>'
            + Utils.spaces('Block             : ') + this.blockDetailLink(tx.blockNumber) + '<br/>'
            + Utils.spaces('From              : ') + tx.from + '<br/>'
            + Utils.spaces('To                : ') + ((tx.to == null) ? 'n.a.' : tx.to) + '<br/>'
            + Utils.spaces('Value             : ') + tx.value + '<br/>'
            + Utils.spaces('Nonce             : ') + tx.nonce + '<br/>'
            + Utils.spaces('ContractAddress   : ') + contractAddress + '<br/>'
            + Utils.spaces('GasUsed           : ') + receipt.gasUsed + '<br/>'
            + Utils.spaces('GasPrice          : ') + tx.gasPrice + '<br/>'
            + Utils.spaces('CumulativeGasUsed : ') + receipt.cumulativeGasUsed + '<br/>'
            + Utils.spaces('InputLength       : ') + tx.input.length + '<br/>'
            + Utils.spaces('Input             : ') + '<br/><p>' + input + "</p>";
    }

}


/**
 * The class BoundaryEventTable shows the main page with the event table, inputs and paginator.
 */
class BoundaryEventTable extends Boundary {

    constructor(control) {
        super(control);

        this.elementProgress = $('.progress');
        this.elementPaginationwrapper = $('.wrapper');
        this.elementProgress.fadeOut(0);

        this.elementEventTable = $("#event_table");
        this.elementEventTableBody = $('#event_table_body');

        this.elementProviderInput = document.querySelector('#input_provider_url');
        this.elementContractAddressInput = document.querySelector('#contract_address');
        this.elementAbiInput = document.querySelector('#contract_abi');
        this.elementConnectionStatusLabel = document.querySelector('#status_message_text');
        this.elementCounterLabel = document.querySelector('#counter');

        this.elementConnectButton = $("#connectButton");
        this.elementLoadAbiButton = $("#loadAbiButton");
        this.elementLoadContractButton = $("#loadContractButton");

        this.initEventHandlerConnectButton();
        this.initEventHandlerUpdateContractAddressButton();
        this.initProviderUrl();
        this.initEventHandlerKeyboardInput();

        let fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', this.loadAbiFile, false);

        setInterval(this.updateUI.bind(this), TIMER_UPDATE_UI_TABLE);

        // Table with pagination
        this.displayRecords = [];
        this.lastNumbeOfRecords = 0;

        this.updateProviderInput();
    }

    loadAbiFile(event) {

        function displayContents(contents) {
            // Check the content of abi file
            try {
                let web3 = new Web3();
                web3.eth.Contract(JSON.parse(contents));
            } catch (e) {
                alert(ALERT_ABI_IS_NOT_WELL_FORMED);
                return
            }

            if (document.getElementById('contract_abi').value !== contents) {
                const elementLoadButton = document.getElementById('loadAbiButton');
                elementLoadButton.removeAttribute("disabled");
            }
            document.getElementById('contract_abi').value = contents;
        }

        let file = event.target.files[0];
        if (!file) {
            return;
        }

        let reader = new FileReader();
        reader.onloadend = function (event) {
            displayContents(event.target.result);
            document.getElementById('contract_address').value = file.name.replace(".abi", "");
            document.getElementById('loadAbiButton').click();
        };
        reader.readAsText(file);
    }

    initEventHandlerUpdateContractAddressButton() {
        const _that = this;
        this.elementLoadAbiButton.click(function () {
            _that.elementEventTable.removeClass('d-block');
            _that.elementPaginationwrapper.removeClass('d-block');

            const contractAddress = _that.elementContractAddressInput.value.trim();

            // Update URL
            let paramsString = (new URL(document.location)).search;
            if (paramsString.search('contract=') > 0) {
                if (contractAddress.length === 42) {
                    paramsString = paramsString.replace('contract=' + _that.control.contractAddress,
                        'contract=' + contractAddress);
                } else {
                    alert(ALERT_INVALID_CONTRACT_ADDRESS);
                    return;
                }
            } else {
                paramsString = paramsString.replace('?',
                    '?contract=' + contractAddress + '&');
            }
            window.history.pushState('', '', paramsString);

            zlib.deflate(_that.elementAbiInput.value, function (err, buffer1) {
                if (!err) {
                    const abiNew = encodeURIComponent(buffer1.toString('base64'));

                    zlib.deflate(_that.control.abi, function (err, buffer2) {
                        if (!err) {
                            const abiOld = encodeURIComponent(buffer2.toString('base64'));

                            // Update URL
                            let paramsString = (new URL(document.location)).search;
                            if (paramsString.search('abi=') > 0) {
                                paramsString = paramsString.replace('abi=' + abiOld,
                                    'abi=' + abiNew);
                            } else {
                                paramsString = paramsString.replace('?',
                                    '?abi=' + abiNew + '&');
                            }
                            window.history.pushState('', '', paramsString);
                            history.go(0)
                        }
                    });
                }
            });
        });
    }

    initEventHandlerConnectButton() {
        const _that = this;

        this.elementConnectButton.click(function () {

            _that.elementEventTable.hide();
            _that.elementPaginationwrapper.hide();

            const providerUrl = _that.elementProviderInput.value.trim();

            let web3Candidate;
            if (providerUrl.startsWith('http')) {
                web3Candidate = new Web3(new Web3.providers.HttpProvider(providerUrl, 1));
            } else if (providerUrl.startsWith('ws')) {
                web3Candidate = new Web3(providerUrl);
            }

            web3Candidate.eth.net.isListening()
                .then(() => {

                    if (providerUrl.startsWith('http')) {
                        let providerHttp = new Web3.providers.HttpProvider(providerUrl, 1);
                        _that.entity.setWeb3(new Web3(providerHttp));
                    } else if (providerUrl.startsWith('ws')) {
                        _that.entity.setWeb3(new Web3(providerUrl));
                    }

                    let paramsString = (new URL(document.location)).search;
                    if (paramsString.search('rpc=') > 0) {
                        paramsString = paramsString.replace('rpc=' + _that.control.provider,
                            'rpc=' + providerUrl);
                    } else {
                        paramsString = paramsString.replace('?',
                            '?rpc=' + providerUrl + '&');
                    }
                    window.history.pushState('', '', paramsString);

                    $("#success-text").text(providerUrl);
                    $("#warning").addClass('d-none');
                    $("#success").removeClass('d-none');
                    $('#myModal2').modal();
                    setTimeout(function () {
                        $('#cancel_button').focus();
                    }, 500);

                })
                .catch(e => {
                    $("#warning-text").html(providerUrl + "<br>Please check RPC API at this URL is accessible");
                    $("#success").addClass('d-none');
                    $("#warning").removeClass('d-none');
                    $('#myModal2').modal();
                });
        });
    }

    initProviderUrl() {
        this.elementProviderInput.value = (this.control.provider);
        this.elementContractAddressInput.value = (this.control.contractAddress);
        this.elementAbiInput.value = (this.control.abi);
    }

    initEventHandlerKeyboardInput() {

        const inputRPC = document.getElementById('input_provider_url');
        inputRPC.addEventListener('keyup', function (event) {
            const contractURLNew = _that.elementProviderInput.value.trim();
            const contractURLOld = _that.control.url;
            const same = (contractURLOld === contractURLNew);
            _that.elementConnectButton.attr("disabled", same);

            if (event.code === "Enter") {
                event.preventDefault();
                document.getElementById('connectButton').click();
            }
        });

        const _that = this;
        const inputContract = document.getElementById('contract_address');
        inputContract.addEventListener('keyup', function (event) {
            const contractAddressNew = _that.elementContractAddressInput.value.trim();
            const contractAddressOld = _that.control.contractAddress;
            const same = (contractAddressOld === contractAddressNew);
            const wrongLength = (contractAddressNew.length !== 42);
            _that.elementLoadAbiButton.attr("disabled", same || wrongLength);

            if (event.code === "Enter") {
                event.preventDefault();
                document.getElementById('loadAbiButton').click();
            }
        });

        const inputABI = document.getElementById('contract_abi');
        inputABI.addEventListener('keyup', function (event) {
            const contractAbiNew = _that.elementAbiInput.value.trim();
            const contractAbiOld = _that.control.abi;
            const same = (contractAbiOld === contractAbiNew);
            _that.elementLoadAbiButton.attr("disabled", same);

            if (event.code === "Enter") {
                event.preventDefault();
                document.getElementById('loadAbiButton').click();
            }
        });
    }

    generate_table() {
        let _that = this;
        this.elementEventTableBody.html('');

        const _indexMax = this.displayRecords.length;
        for (let _index = 0; _index < _indexMax; _index++) {

            // Row to be rendered
            let row = _that.displayRecords[_index];

            if (row.time.length === 0) {
                // transactions have not timestamp, so this is the lazy loading of the block
                _that.entity.web3.eth.getBlock(_that.displayRecords[_index].block, false)
                    .then(block => {
                        row.time = Utils.convertTimestamp(block.timestamp);
                        row.image = blockies({seed: row.name, size: 8, scale: 16}).toDataURL();
                        this.printRow(_that, row);
                    });
            } else {
                this.printRow(_that, row);
            }
        }

        this.elementEventTable.addClass('d-block');
        this.elementPaginationwrapper.addClass('d-block');
    }

    printRow(_that, row) {
        _that.elementEventTableBody.append('<tr>'
            + '<td>' + row.number + '</td>'
            + '<td><img alt=\"miner\" src=\"' + row.image + '\"/>&nbsp;&nbsp;' + row.name + "</td>"
            + "<td>" + _that.blockDetailLink(row.block) + "</td>"
            + "<td>" + _that.trxDetailLinkTruncated(row.hash) + "</td>"
            + "<td>" + row.time + "</td>"
            + row.value
            + "</tr>");
    }

    updateTable(force) {
        if (this.control.entity.events.length > this.lastNumbeOfRecords || force) {

            this.lastNumbeOfRecords = this.control.entity.events.length;

            $('#paginationholder').html('');
            $('#paginationholder').html('<ul id="pagination" class="pagination-sm"></ul>');

            let _that = this;
            const _totalPages = Math.ceil(_that.entity.events.length / EVENT_TABLE_RECORDS_PER_PAGE);
            $('#pagination').twbsPagination(
                {
                    totalPages: _totalPages,
                    visiblePages: 20,
                    onPageClick: function (event, page) {
                        _that.displayRecordsIndex = Math.max(page - 1, 0) * EVENT_TABLE_RECORDS_PER_PAGE;
                        _that.endRec = (_that.displayRecordsIndex) + EVENT_TABLE_RECORDS_PER_PAGE;
                        _that.displayRecords = _that.entity.events.slice(_that.displayRecordsIndex, _that.endRec);
                        _that.generate_table();
                    }
                });

            if (!force) {
                Utils.sleep(1000).then(() => {
                    this.updateTable(true);
                });
            }
        }
    }

    updateUI() {
        this.updateStatusText();
        this.updateTable(false);
        this.updateProviderInput();
        this.updateProgressBar();
        this.updateLinks();


    }

    updateLinks() {
        $('.bmd-modalLink').on('click', function () {
            $('#myModal1').modal('show');
        });

        $('#myModal1').on('hidden.bs.modal', function () {
            $('#myModal1').find('iframe').html('').attr("src", '');
        });
    }

    updateProgressBar() {
        if (this.control.getEventsProgress === 100) {
            this.getEventsProgress = 0;
            $('.progress-bar').css('width', this.getEventsProgress + '%');
        }
    }


    updateProviderInput() {
        if (this.control.getEventsSucceeded) {
            $('#contract_abi').addClass('is-valid');
            $('#contract_address').addClass('is-valid');
            $('#contract_abi').removeClass('is-invalid');
            $('#contract_address').removeClass('is-invalid');
        } else {
            $('#contract_abi').removeClass('is-valid');
            $('#contract_address').removeClass('is-valid');
            $('#contract_abi').addClass('is-invalid');
            $('#contract_address').addClass('is-invalid');
        }

        if (this.entity.connectionWorking) {
            $('#input_provider_url').removeClass('is-invalid');
            $('#input_provider_url').addClass('is-valid');

            $('#status_message_text').removeClass('text-warning');
            $('#status_message_text').addClass('text-success');
        } else {
            $('#input_provider_url').addClass('is-invalid');
            $('#input_provider_url').removeClass('is-valid');

            $('#status_message_text').removeClass('text-success');
            $('#status_message_text').addClass('text-warning');
        }
    }

    updateStatusText() {
        this.elementConnectionStatusLabel.textContent = (this.entity.connectionMessage);
        if (this.entity.syncing) {
            this.elementCounterLabel.textContent = (this.control.getCurrentBlockNumber() + '/' + this.entity.highestBlock);
        } else {
            this.elementCounterLabel.textContent = (this.control.getCurrentBlockNumber());
        }
    }

}


/**
 * The class Main is used to start the application
 */
class Main {

    constructor() {
        this.control = new Control(new Entity());
    }

    /**
     * Delayed start of user interface (to fetch last blockNumber number and status first)
     */
    run() {
        Utils.sleep(100).then(() => {

            // Determine the content to be displayed
            if ((new URL(document.location).pathname === '/main.html')) {

                // Create table view
                this.boundary = new BoundaryEventTable(this.control);

                // Run event table
                this.control.runLoadTable();

            } else {
                // Create details view
                this.boundary = new BoundaryDetails(this.control);

                // Run transaction details
                if ((new URL(window.location.href).searchParams.get("trx") || '').length > 0) {
                    this.boundary.runLoadTrx();
                }

                // Run block details
                if ((new URL(window.location.href).searchParams.get("block") || '').length > 0) {
                    this.boundary.runLoadBlock();
                }
            }
        });
    }
}

/**
 *  Start application
 */
new Main().run();





