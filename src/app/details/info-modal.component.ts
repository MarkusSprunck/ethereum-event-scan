import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {UtilsService} from "../services/utils.service";

export interface DialogData {
    block: string;
    transaction: string;
    content: string;
}

@Component({
    selector: 'app-info-modal',
    templateUrl: './info-modal.component.html',
    styleUrls: ['./info-modal.component.css']
})
export class InfoModalComponent {

    constructor(public dialogRef: MatDialogRef<InfoModalComponent>,
                @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    }

    onCloseClick(): void {
        this.dialogRef.close();
    }

    public static printBlock(block, numberLast) {
        const blockNumber = block.number;
        const child = (numberLast > blockNumber) ? (blockNumber + 1) : 'n.a.';
        const current = (blockNumber);
        const parent = (blockNumber > 0) ? (blockNumber - 1) : '0';
        let result = ''
            + UtilsService.spaces('Number       : ') + current + '<br/>'
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
            block.transactions.forEach((trxHash) => {
                if (0 === index) {
                    result += 'Transactions : ' + trxHash + '<br/>';
                } else {
                    result += UtilsService.spaces('               ') + trxHash + '<br/>';
                }
                index++;
            });
        }

        return result;
    }

    public static printTrx(tx, receipt) {

        // Format input (in the case it is too long for one line)
        let input = ' ' + tx.input;
        const width = 3;
        for (let x = 1; (width * x) <= input.length; x++) {
            input = input.slice(0, width * x) + ' ' + input.slice(width * x);
        }

        // Print transaction details
        const contractAddress = (receipt.contractAddress === null) ? 'n.a.' : receipt.contractAddress;
        return ''
            + UtilsService.spaces('Hash          : ') + (tx.hash) + '<br/>'
            + UtilsService.spaces('Index         : ') + tx.transactionIndex + '<br/>'
            + UtilsService.spaces('Block         : ') + (tx.blockNumber) + '<br/>'
            + UtilsService.spaces('From          : ') + tx.from + '<br/>'
            + UtilsService.spaces('To            : ') + ((tx.to == null) ? 'n.a.' : tx.to) + '<br/>'
            + UtilsService.spaces('Value         : ') + tx.value + '<br/>'
            + UtilsService.spaces('Nonce         : ') + tx.nonce + '<br/>'
            + UtilsService.spaces('Contract      : ') + contractAddress + '<br/>'
            + UtilsService.spaces('GasUsed       : ') + receipt.gasUsed + '<br/>'
            + UtilsService.spaces('GasPrice      : ') + tx.gasPrice + '<br/>'
            + UtilsService.spaces('CumulativeGas : ') + receipt.cumulativeGasUsed + '<br/>'
            + UtilsService.spaces('InputLength   : ') + tx.input.length + '<br/><br/>' + input;
    }

}
