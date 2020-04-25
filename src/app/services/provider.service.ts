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

import Web3 from 'web3';
import {Injectable} from '@angular/core';

/**
 * The class ProviderService stores the connection status.
 */
@Injectable({
    providedIn: 'root',
})
export class ProviderService {

    public web3 = null;

    public currentBlock = 0;

    public highestBlock = 0;

    public connected = false;

    /**
     * Create connection to blockchain
     */
    setProvider(providerUrl) {

        this.connected = false;
        this.web3 = null;

        if (providerUrl.startsWith('http')) {
            this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
        } else if (providerUrl.startsWith('ws')) {
            this.web3 = new Web3(providerUrl);
        }

        // Check success
        if (this.web3 === null) {
            this.connected = false;
            return;
        }

        // Update status
        this.isConnectionWorking();
        this.isSyncing();
    }

    /**
     * The current value is maybe not the lastBlock status of syncing
     */
    isSyncing() {

        if (this.web3 === null) {
            return false;
        }

        this.web3.eth.isSyncing((error, sync) => {
            if (!error && sync) {
                this.currentBlock = sync.currentBlock;
                this.highestBlock = sync.highestBlock;
            }
        });

        return this.highestBlock > this.currentBlock;
    }

    /**
     * The current value is maybe not the lastBlock status of connection
     */
    isConnectionWorking() {

        if (this.web3 === null) {
            this.connected = false;
            return false;
        }

        this.web3.eth.net.isListening()
            .then(() => {
                this.connected = true;
            })
            .catch(() => {
                this.connected = false;
            });

        return this.connected;
    }

}

