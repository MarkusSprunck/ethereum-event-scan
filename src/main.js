/**
 * Load all libraries
 */
let ZLib = require('zlib');             // Compression of abi file for URL parameter encoding
let blockies = require('blockies');     // Render coloured images
let $ = require("jquery");              // UI helper
global.jQuery = $;                          // Needed to run Bootstrap with jQuery
require('jquery-ui-dist/jquery-ui');    // UI helper (draggable dialog)
require("bootstrap");                   // UI framework
require("twbs-pagination");             // Paginator support

const Utils = require("../src/utils.js");
const Entity = require("../src/entity.js");
const Control = require("../src/control.js");

/**
 * Global constants and message texts
 */
const ALERT_ABI_IS_NOT_WELL_FORMED = "ABI is not valid";
const ALERT_INVALID_CONTRACT_ADDRESS = "Invalid contract address\n\nExpected are two characters '0x' and 40 hex digits";
const TIMER_UPDATE_UI_DETAILS = 1000;
const TIMER_UPDATE_UI_TABLE = 1000;
const EVENT_TABLE_RECORDS_PER_PAGE = 10;


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
        let url = 'http://' + this.control.serverHost + '/details.html?trx=' + hash + '&provider=' + this.control.provider;
        let result = '<a class="bmd-modalLink" href=' + url + ' target="myFrame" >' + hash + '</a>';
        return result;
    }

    trxDetailLinkTruncated(hash) {
        let url = 'http://' + this.control.serverHost + '/details.html?trx=' + hash + '&provider=' + this.control.provider;
        let result = '<a class="bmd-modalLink" href=' + url + ' target="myFrame" >' + Utils.truncate(hash, 12) + '</a>';
        return result;
    }

    blockDetailLink(block) {
        let url = 'http://' + this.control.serverHost + '/details.html?block=' + block + '&provider=' + this.control.provider;
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
        let numberLast = this.control.getCurrentBlockNumber(true);
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

        this.elementEventTable = $("#event_table");
        this.elementEventTableBody = $('#event_table_body');

        this.elementRefreshInput = document.querySelector('#auto_refresh');
        this.elementProviderInput = document.querySelector('#input_provider_url');
        this.elementContractAddressInput = document.querySelector('#contract_address');
        this.elementAbiInput = document.querySelector('#contract_abi');
        this.elementCounterLabel = document.querySelector('#counter_view');
        this.elementStartLabel = document.querySelector('#start-block');
        this.elementStopLabel = document.querySelector('#stop-block');

        this.elementConnectButton = $("#connectButton");
        this.elementLoadAbiButton = $("#loadAbiButton");
        this.elementLoadContractButton = $("#loadContractButton");

        this.initEventHandlerConnectButton();
        this.initEventHandlerUpdateContractAddressButton();
        this.initProviderUrl();
        this.initEventHandlerKeyboardInput();
        this.initElementHandlerRefreshInput();

        let fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', this.loadAbiFile, false);

        this.elementStartLabel.value = (this.control.eventsBlockFromInitial);
        this.elementStopLabel.value = (this.control.eventsBlockTo);
        this.elementRefreshInput.checked = (this.control.refresh);

        setInterval(this.updateUI.bind(this), TIMER_UPDATE_UI_TABLE);

        $("#myModal1").draggable({
            handle: ".modal-header"
        });

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
                let contract = web3.eth.contract(JSON.parse(contents));
            } catch (e) {
                console.log(ALERT_ABI_IS_NOT_WELL_FORMED, e);
                return
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

    initElementHandlerRefreshInput() {
        let _that = this;
        this.elementRefreshInput.addEventListener('click', function () {
            const newValue = this.checked;
            _that.control.refresh = newValue;
            let paramsString = (new URL(document.location)).search;
            if (paramsString.search('refresh=') > 0) {
                paramsString = paramsString.replace('refresh=' + !newValue, 'refresh=' + newValue);
            } else {
                paramsString = paramsString.replace('?', '?refresh=' + newValue + '&');
            }
            window.history.pushState('', '', paramsString);
        });
    }

    initEventHandlerUpdateContractAddressButton() {
        const _that = this;
        this.elementLoadAbiButton.click(function (event) {

            _that.elementEventTable.removeClass('d-block');
            _that.elementPaginationwrapper.removeClass('d-block');

            // Update URL with contract address (replace all double spaces)
            const contractAddress = _that.elementContractAddressInput.value.trim().replace(/  +/g, ' ');
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

            if (event.shiftKey) {
                var domainURLs = [ // try these netowrks to load ABI from verified contract
                    "http://api.etherscan.io",
                    "http://api-kovan.etherscan.io",
                    "http://api-ropsten.etherscan.io"]
                domainURLs.forEach(function (domain) {
                    var xmlhttp;
                    if (window.XMLHttpRequest) {
                        xmlhttp = new XMLHttpRequest();
                        xmlhttp.onreadystatechange = function () {
                            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                                if ("Contract source code not verified" !== xmlhttp.responseText) {
                                    _that.elementAbiInput.value = xmlhttp.responseText;
                                    console.log('loaded -> ' + xmlhttp.responseText);
                                    _that.updateURLwithCompressedAbi();
                                    return;
                                }
                            }
                        }
                        let url = domain + '/api?module=contract&action=getabi&address=' + contractAddress + '&format=raw';
                        console.log('try to load -> ' + url);
                        xmlhttp.open("GET", url, true);
                        xmlhttp.send();
                    }
                });

            } else {
                _that.updateURLwithCompressedAbi();
            }
        });
    }

    updateURLwithCompressedAbi() {
        let _that = this;
        ZLib.deflate(_that.elementAbiInput.value, function (err, buffer1) {
            if (!err) {
                const abiNew = encodeURIComponent(buffer1.toString('base64'));
                ZLib.deflate(_that.control.abi, function (err, buffer2) {
                    if (!err) {
                        const abiOld = encodeURIComponent(buffer2.toString('base64'));
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
    }

    initEventHandlerConnectButton() {
        const _that = this;

        this.elementConnectButton.click(function () {

            _that.elementEventTable.hide();
            _that.elementPaginationwrapper.hide();

            const providerUrl = _that.elementProviderInput.value.trim();

            setTimeout(function () {
                $('#contract_abi').addClass('is-invalid');
                $('#contract_input_provider_url').addClass('is-invalid');
                $('#contract_address').addClass('is-invalid');

                _that.control.getEventsSucceeded = false;

                let paramsString = (new URL(document.location)).search;
                if (paramsString.search('provider=') > 0) {
                    paramsString = paramsString.replace('provider=' + _that.control.provider,
                        'provider=' + providerUrl);
                } else {
                    paramsString = paramsString.replace('?',
                        '?provider=' + providerUrl + '&');
                }
                window.history.pushState('', '', paramsString);
            }, 50);

            setTimeout(function () {

                let web3Candidate;
                if (providerUrl.startsWith('http')) {
                    web3Candidate = new Web3(new Web3.providers.HttpProvider(providerUrl, 1));
                } else if (providerUrl.startsWith('ws')) {
                    web3Candidate = new Web3(providerUrl);
                }

                if (providerUrl.startsWith('http')) {
                    let providerHttp = new Web3.providers.HttpProvider(providerUrl, 1);
                    _that.entity.setWeb3(new Web3(providerHttp));
                } else if (providerUrl.startsWith('ws')) {
                    _that.entity.setWeb3(new Web3(providerUrl));
                }

                history.go(0);
            }, 500);
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
            const wrongLength = (contractAddressNew.length !== 42);
            _that.elementLoadAbiButton.attr("disabled", wrongLength);
            if (event.code === "Enter") {
                event.preventDefault();
                document.getElementById('loadAbiButton').click();
            }
        });

        const inputABI = document.getElementById('contract_abi');
        inputABI.addEventListener('keyup', function (event) {
            const contractAbiNew = _that.elementAbiInput.value.trim();
            const contractAbiOld = _that.control.abi;
            if (event.code === "Enter") {
                event.preventDefault();
                document.getElementById('loadAbiButton').click();
            }
        });


        const inputStart = document.getElementById('start-block');
        inputStart.addEventListener('keyup', function (event) {
            const startNew = inputStart.value;
            const startOld = _that.control.eventsBlockFromInitial;
            if (event.code === "Enter") {
                event.preventDefault();
                let paramsString = (new URL(document.location)).search;
                if (paramsString.search('start=') > 0) {
                    paramsString = paramsString.replace('start=' + startOld, 'start=' + startNew);
                } else {
                    paramsString = paramsString.replace('?', '?start=' + startNew + '&');
                }
                window.history.pushState('', '', paramsString);
                history.go(0);
            }
        });

        const inputStop = document.getElementById('stop-block');
        inputStop.addEventListener('keyup', function (event) {
            const stopNew = inputStop.value;
            const stopOld = _that.control.eventsBlockTo;
            if (event.code === "Enter") {
                event.preventDefault();
                let paramsString = (new URL(document.location)).search;
                if (paramsString.search('stop=') > 0) {
                    paramsString = paramsString.replace('stop=' + stopOld, 'stop=' + stopNew);
                } else {
                    paramsString = paramsString.replace('?', '?stop=' + stopNew + '&');
                }
                window.history.pushState('', '', paramsString);
                history.go(0);
            }
        });
    }

    generate_table() {
        let _that = this;
        this.elementEventTableBody.html('');

        const _indexMax = this.displayRecords.length;
        for (let _index = 0; _index < _indexMax; _index++) {
            let row = _that.displayRecords[_index];
            row.image = blockies({
                seed: row.name,
                size: 100,
                scale: 16
            }).toDataURL();
            this.printRow(_that, row);

        }

        this.elementEventTable.addClass('d-block');
        this.elementPaginationwrapper.addClass('d-block');
    }

    printRow(_that, row) {
        _that.elementEventTableBody.append('<tr>'
            + "<td>" + row.number + "</td>"
            + '<td><img alt=\"miner\" src=\"' + row.image + '\"/>&nbsp;&nbsp;' + row.name + "</td>"
            + "<td>" + _that.blockDetailLink(row.block) + "</td>"
            + "<td>" + _that.trxDetailLinkTruncated(row.hash) + "</td>"
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
                    visiblePages: 15,
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
        this.updateCounterText();
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
        } else {
            $('#input_provider_url').addClass('is-invalid');
            $('#input_provider_url').removeClass('is-valid');
        }
    }


    updateCounterText() {
        if (this.entity.syncing) {
            this.elementCounterLabel.value = (this.control.getCurrentBlockNumber(this.control.refresh) + '/' + this.entity.highestBlock);
        } else {
            this.elementCounterLabel.value = (this.control.getCurrentBlockNumber(this.control.refresh));
        }
    }

}


/**
 * The class Main is used to start the application
 */
class Main {

    constructor() {
        this.control = new Control(new Entity(), (value) => {
            $('.progress-bar').css('width', value + '%');
        }, window.location.href);
    }

    /**
     * Delayed start of user interface (to fetch last blockNumber number and status first)
     */
    run() {
        Utils.sleep(100).then(() => {

            // Determine the content to be displayed
            if (new URL(document.location).pathname === '/main.html') {

                // Create table view
                this.boundary = new BoundaryEventTable(this.control);

                // Run event table
                this.control.runLoadTable();

            } else if (new URL(document.location).pathname === '/details.html') {
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