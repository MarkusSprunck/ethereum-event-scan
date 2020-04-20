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
    panelOpenState: boolean = false;

    ngOnInit() {
        this.reader.setUpdateCallback(() => {
            this.panelOpenState = true;
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

        if (event != null) {
            event.preventDefault();
        }

        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = false;
        dialogConfig.autoFocus = true;
        dialogConfig.width = "50rem";

        if (blockNumber != null && blockNumber.length > 0) {
            const _that = this;
            this.reader.entity.web3.eth.getBlock(blockNumber,
                function (error, block) {
                    dialogConfig.data = {
                        "block": blockNumber,
                        "transaction": trxNumber,
                        "content": EventsListComponent.printBlock(block, _that.reader.getCurrentBlockNumber())
                    };
                    _that.dialog.open(InfoModalComponent, dialogConfig);
                });
        }

        if (trxNumber != null && trxNumber.length > 0) {
            const _that = this;
            this.reader.entity.web3.eth.getTransaction(trxNumber).then(tx => {
                this.reader.entity.web3.eth.getTransactionReceipt(trxNumber).then(receipt => {
                    dialogConfig.data = {
                        "block": blockNumber,
                        "transaction": trxNumber,
                        "content": EventsListComponent.printTrx(tx, receipt)
                    };
                    _that.dialog.open(InfoModalComponent, dialogConfig);
                });
            });
        }
    }

    private static printBlock(block, numberLast) {
        let number = block.number;
        let child = (numberLast > number) ? (number + 1): 'n.a.';
        let current = (number);
        let parent = (number > 0) ? (number - 1) : "0";
        let result = ''
            + UtilsService.spaces('Number       : ') + current + "<br/>"
            + UtilsService.spaces('Parent       : ') + parent + '<br/>'
            + UtilsService.spaces('Child        : ') + child + '<br/>'
            + UtilsService.spaces('Time         : ') + UtilsService.convertTimestamp(block.timestamp) + '<br/>'
            + UtilsService.spaces('Current hash : ') + block.hash + '<br/>'
            + UtilsService.spaces('Sha3Uncles   : ') + block.sha3Uncles + '<br/>'
            + UtilsService.spaces('StateRoot    : ') + block.stateRoot + '<br/>'
            + UtilsService.spaces('Miner        : ') + block.miner + '<br/>'
            + UtilsService.spaces('ExtraData    : ') + block.extraData + '<br/>'
            + UtilsService.spaces('Size         : ') + block.size + '<br/>'
            + UtilsService.spaces('GasUsed      : ') + block.gasUsed + '<br/>'
            + UtilsService.spaces('TrxCount     : ') + block.transactions.length + '<br/>';

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


    private static printTrx(tx, receipt) {

        // Format input (in the case it is too long for one line)
        let input = "&zwj;" + tx.input;
        let width = 100;
        for (let x = 1; (width * x) <= input.length; x++) {
            input = input.slice(0, width * x) + '<br/>' + input.slice(width * x)
        }

        // Print transaction details
        let contractAddress = (receipt.contractAddress === null) ? 'n.a.' : receipt.contractAddress;
        return ''
            +UtilsService.spaces('Hash          : ') + (tx.hash) + '<br/>'
            +UtilsService.spaces('Index         : ') + tx.transactionIndex + '<br/>'
            +UtilsService.spaces('Block         : ') + (tx.blockNumber) + '<br/>'
            +UtilsService.spaces('From          : ') + tx.from + '<br/>'
            +UtilsService.spaces('To            : ') + ((tx.to == null) ? 'n.a.' : tx.to) + '<br/>'
            +UtilsService.spaces('Value         : ') + tx.value + '<br/>'
            +UtilsService.spaces('Nonce         : ') + tx.nonce + '<br/>'
            +UtilsService.spaces('Contract      : ') + contractAddress + '<br/>'
            +UtilsService.spaces('GasUsed       : ') + receipt.gasUsed + '<br/>'
            +UtilsService.spaces('GasPrice      : ') + tx.gasPrice + '<br/>'
            +UtilsService.spaces('CumulativeGas : ') + receipt.cumulativeGasUsed + '<br/>'
            +UtilsService.spaces('InputLength   : ') + tx.input.length + '<br/>'
            +UtilsService.spaces('Input         : ') + '<br/><p>' + input + "</p>";
    }


    panelMessage() {
        return EventData.length > 0  ? 'Number of ' + EventData.length + ' events loaded' : 'Results - No events loaded';
    }
}
