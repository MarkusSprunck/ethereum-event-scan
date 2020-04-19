import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {MatPaginator} from "@angular/material/paginator";
import {EventData} from "../services/event-data";
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {InfoModalComponent} from "../details/info-modal.component";
import {UtilsService} from "../services/utils.service";
import {Reader} from "../services/reader.service";

@Component({
    selector: 'app-events-list',
    templateUrl: './events-list.component.html',
    styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit {

    constructor(
        private reader: Reader,
        public dialog: MatDialog) {
    }

    listData: MatTableDataSource<any>;

    displayedColumns: string[] = ['name', 'block', 'trxHash', 'key', 'value'];

    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    searchKey: string;

    ngOnInit() {
        this.reader.setUpdateCallback(() => {
            this.listData = new MatTableDataSource(EventData);
            this.listData.sort = this.sort;
            this.listData.paginator = this.paginator;
            this.listData.filterPredicate = (data, filter) => {
                return this.displayedColumns.some(ele => {
                    return data[ele].toLowerCase().indexOf(filter) != -1;
                });
            };
        });
    }

    onSearchClear() {
        this.searchKey = "";
        this.applyFilter();
    }

    applyFilter() {
        this.listData.filter = this.searchKey.trim().toLowerCase();
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

    private printBlock(block) {
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


    private printTrx(tx, receipt) {

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


}
