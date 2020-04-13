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
import {Component, Input, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Observable} from 'rxjs';

import {Event} from '../services/event';
import {EventsService} from './events-service';
import {SortableHeader, SortEvent} from './sortable-header';
import {InfoModalComponent} from "../details/info-modal.component";
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {Reader} from "../services/reader.service";
import {UtilsService} from "../services/utils.service";
import {FormBuilder, FormGroup} from "@angular/forms";

@Component(
    {
        selector: 'table-complete',
        templateUrl: './table-complete.html',
        styleUrls: ['./table-complete.css'],
        providers: [EventsService, DecimalPipe]
    })
export class TableComplete implements OnInit {

    public formResult: FormGroup;

    @Input() public searchTerm: string = '';

    events$: Observable<Event[]>;

    total$: Observable<number>;

    @ViewChildren(SortableHeader) headers: QueryList<SortableHeader>;

    constructor(
        private fb: FormBuilder,
        private reader: Reader,
        public service: EventsService,
        public dialog: MatDialog) {
        this.events$ = service.events$;
        this.total$ = service.total$;
    }

    ngOnInit() {
        this.formResult = this.fb.group({
            searchTerm: [''],
        });
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
        let child = (numberLast > number) ? (number + 1): 'n.a.';
        let current = (number);
        let parent = (number > 0) ? (number - 1) : "0";
        let result = ''
            +'Number : ' + current + "<br/>"
            +'Parent : ' + parent + '<br/>'
            +'Child : ' + child + '<br/>'
            +'Time : ' + UtilsService.convertTimestamp(block.timestamp) + '<br/>'
            +'Current hash : ' + block.hash + '<br/>'
            +'Sha3Uncles : ' + block.sha3Uncles + '<br/>'
            +'StateRoot : ' + block.stateRoot + '<br/>'
            +'Miner : ' + block.miner + '<br/>'
            +'ExtraData : ' + block.extraData + '<br/>'
            +'Size : ' + block.size + '<br/>'
            +'GasUsed : ' + block.gasUsed + '<br/>'
            +'TransactionsCount : ' + block.transactions.length + '<br/>';

        // print all transactions of block
        if (block.transactions.length > 0) {
            let index = 0;
            let _that = this;
            block.transactions.forEach(function (trxHash) {
                if (0 === index) {
                    result +='Transactions : ';
                    result += trxHash + '<br/>';
                } else {
                    result +='                    ';
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
            +'Hash : ' + (tx.hash) + '<br/>'
            +'Index : ' + tx.transactionIndex + '<br/>'
            +'Block : ' + (tx.blockNumber) + '<br/>'
            +'From : ' + tx.from + '<br/>'
            +'To : ' + ((tx.to == null) ? 'n.a.' : tx.to) + '<br/>'
            +'Value : ' + tx.value + '<br/>'
            +'Nonce : ' + tx.nonce + '<br/>'
            +'ContractAddress : ' + contractAddress + '<br/>'
            +'GasUsed : ' + receipt.gasUsed + '<br/>'
            +'GasPrice : ' + tx.gasPrice + '<br/>'
            +'CumulativeGasUsed : ' + receipt.cumulativeGasUsed + '<br/>'
            +'InputLength : ' + tx.input.length + '<br/>'
            +'Input : ' + '<br/><p>' + input + "</p>";
    }


    updateSearchTerm() {
        let val = this.formResult.get("searchTerm").value;
        console.log('searchTerm =>',this.service.searchTerm, ' -> ', val);
        this.service.searchTerm = val;
        this.searchTerm = val;
    }
}


