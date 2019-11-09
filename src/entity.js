/**
 * Dependencies
 */
let Web3 = require('web3');             // Connect to Ethereum network


/**
 * Global constants and message texts
 */
const MESSAGE_CONNECTED = 'Connected';
const MESSAGE_NOT_CONNECTED = 'Not connected';


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

        // Update status
        this.isConnectionWorking();
        this.isSyncing();
    }

    /**
     * Create connection to blockchain
     * */
    init(providerUrl) {

        if (providerUrl !== null) {
            if (providerUrl.startsWith('http')) {
                this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
            } else if (providerUrl.startsWith('ws')) {
                this.web3 = new Web3(providerUrl);
            }
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

        if (this.web3 === null) {
            this.connectionMessage = MESSAGE_NOT_CONNECTED;
            return false
        }

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

        if (this.web3 === null) {
            this.connectionMessage = MESSAGE_NOT_CONNECTED;
            return false
        }

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

module.exports = Entity;