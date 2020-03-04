import {Component, Inject, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UtilsService} from "../services/utils.service";
import {Reader} from "../services/reader.service";

export interface DialogData {
    block: string;
    transaction: string;
}

@Component({
    selector: "app-info-modal",
    templateUrl: "./info-modal.component.html",
    styleUrls: ["./info-modal.component.css"]
})
export class InfoModalComponent implements OnInit {

    content = "loading...";

    constructor(
        public control: Reader,
        public dialogRef: MatDialogRef<InfoModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {

    }

    ngOnInit(): void {
        if (this.data.block.length > 0) {
            this.runLoadBlock(this.data.block);
        }

        if (this.data.transaction.length > 0) {
            this.runLoadTrx(this.data.transaction);
        }
    }


    onCloseClick(): void {
        this.dialogRef.close();
    }

    /** Load details view of distinct trxNumber */
    runLoadTrx(trxNumber) {
        this.control.entity.web3.eth.getTransaction(trxNumber).then(tx => {
            if (tx === null) {
                return
            }
            this.control.entity.web3.eth.getTransactionReceipt(trxNumber).then(receipt => {
                this.content = this.printTrx(tx, receipt);
            });
        });
    }

    runLoadBlock(blockNumber) {
        this.control.entity.web3.eth.getBlock(blockNumber).then(block => {
            if (block === null) {
                return
            }
            this.content = this.printBlock(block);
        });
    }

    printBlock(block) {
        // print block details
        let number = block.number;
        let numberLast = this.control.getCurrentBlockNumber();
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
