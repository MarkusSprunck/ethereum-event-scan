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

import {DecimalPipe} from '@angular/common';
import {Component, QueryList, ViewChildren} from '@angular/core';
import {Observable} from 'rxjs';

import {Event} from '../services/event';
import {EventsService} from './events-service';
import {SortableHeader, SortEvent} from './sortable-header';
import {InfoModalComponent} from "../details/info-modal.component";
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {Reader} from "../services/reader.service";
import {UtilsService} from "../services/utils.service";

@Component(
    {
        selector: 'table-complete',
        templateUrl: './table-complete.html',
        styleUrls: ['./table-complete.css'],
        providers: [EventsService, DecimalPipe]
    })
export class TableComplete {

    events$: Observable<Event[]>;

    total$: Observable<number>;

    @ViewChildren(SortableHeader) headers: QueryList<SortableHeader>;

    constructor(
        private reader: Reader,
        public service: EventsService,
        public dialog: MatDialog) {
        this.events$ = service.events$;
        this.total$ = service.total$;
    }

    onSort({column, direction}: SortEvent) {

        // resetting other headers
        this.headers.forEach(header => {
            if (header.sortable !== column) {
                header.direction = '';
            }
        });

        this.service.sortColumn = column;
        this.service.sortDirection = direction;
    }

    openDetailsDialog(event: any, blockNumber: string, trxNumber: string): void {
        event.preventDefault();

        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = false;
        dialogConfig.autoFocus = true;
        dialogConfig.width = "50rem";

        if (blockNumber.length > 0) {
            const _that = this;
            this.reader.entity.web3.eth.getBlock(blockNumber,
                function (error, block) {
                    dialogConfig.data = {
                        "block": blockNumber,
                        "transaction": trxNumber,
                        "content": _that.printBlock(block)
                    };
                    _that.dialog.open(InfoModalComponent, dialogConfig);
                });
        }

        if (trxNumber.length > 0) {
            const _that = this;
            this.reader.entity.web3.eth.getTransaction(trxNumber).then(tx => {
                this.reader.entity.web3.eth.getTransactionReceipt(trxNumber).then(receipt => {
                    dialogConfig.data = {
                        "block": blockNumber,
                        "transaction": trxNumber,
                        "content": _that.printTrx(tx, receipt)
                    };
                    _that.dialog.open(InfoModalComponent, dialogConfig);
                });
            });
        }
    }

    public printBlock(block) {
        let number = block.number;
        let numberLast = this.reader.getCurrentBlockNumber();
        let child = (numberLast > number) ? (number + 1) : 'n.a.';
        let current = (number);
        let parent = (number > 0) ? (number - 1) : "0";
        let result = ''
            + UtilsService.spaces('Number            : ') + current + "<br/>"
            + UtilsService.spaces('Parent            : ') + parent + '<br/>'
            + UtilsService.spaces('Child             : ') + child + '<br/>'
            + UtilsService.spaces('Time              : ') + UtilsService.convertTimestamp(block.timestamp) + '<br/>'
            + UtilsService.spaces('Current hash      : ') + block.hash + '<br/>'
            + UtilsService.spaces('Sha3Uncles        : ') + block.sha3Uncles + '<br/>'
            + UtilsService.spaces('StateRoot         : ') + block.stateRoot + '<br/>'
            + UtilsService.spaces('Miner             : ') + block.miner + '<br/>'
            + UtilsService.spaces('ExtraData         : ') + block.extraData + '<br/>'
            + UtilsService.spaces('Size              : ') + block.size + '<br/>'
            + UtilsService.spaces('GasUsed           : ') + block.gasUsed + '<br/>'
            + UtilsService.spaces('TransactionsCount : ') + block.transactions.length + '<br/>';

        // print all transactions of block
        if (block.transactions.length > 0) {
            let index = 0;
            let _that = this;
            block.transactions.forEach(function (trxHash) {
                if (0 === index) {
                    result += UtilsService.spaces('Transactions      : ');
                    result += trxHash + '<br/>';
                } else {
                    result += UtilsService.spaces('                    ');
                    result += trxHash + '<br/>';
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
        return ''
            + UtilsService.spaces('Hash              : ') + (tx.hash) + '<br/>'
            + UtilsService.spaces('Index             : ') + tx.transactionIndex + '<br/>'
            + UtilsService.spaces('Block             : ') + (tx.blockNumber) + '<br/>'
            + UtilsService.spaces('From              : ') + tx.from + '<br/>'
            + UtilsService.spaces('To                : ') + ((tx.to == null) ? 'n.a.' : tx.to) + '<br/>'
            + UtilsService.spaces('Value             : ') + tx.value + '<br/>'
            + UtilsService.spaces('Nonce             : ') + tx.nonce + '<br/>'
            + UtilsService.spaces('ContractAddress   : ') + contractAddress + '<br/>'
            + UtilsService.spaces('GasUsed           : ') + receipt.gasUsed + '<br/>'
            + UtilsService.spaces('GasPrice          : ') + tx.gasPrice + '<br/>'
            + UtilsService.spaces('CumulativeGasUsed : ') + receipt.cumulativeGasUsed + '<br/>'
            + UtilsService.spaces('InputLength       : ') + tx.input.length + '<br/>'
            + UtilsService.spaces('Input             : ') + '<br/><p>' + input + "</p>";
    }


}


