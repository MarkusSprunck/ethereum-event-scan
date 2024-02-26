import {Component, Input, OnInit} from '@angular/core';
import {UtilsService} from '../../services/utils.service';
import {DialogData} from './modal-dialog.component';

@Component({
  selector: 'app-inner-component',
  templateUrl: './modal-dialog-content.component.html',
  styleUrls: ['./modal-dialog-content.component.scss']
})
export class ModalDialogContentComponent implements OnInit {

  @Input()
  inputData: DialogData | undefined;

  currentTrxNumber = '';

  currentBlockNumber = '';

  child = '';

  current = '';

  parent = '';

  details = '';

  transactions: any;

  ngOnInit() {

    // @ts-ignore
    if (this.inputData.trxNumber != null && this.inputData.trxNumber.length > 0) {

      // @ts-ignore
      this.renderTransaction(this.inputData.trxNumber);
    } else {

      // @ts-ignore
      this.renderBlock(this.inputData.blockNumber);
    }
  }

  public renderTransaction(trxNumber: string) {
    this.currentTrxNumber = trxNumber;
    this.currentBlockNumber = '';
    this.transactions = [];

    // @ts-ignore
    this.inputData.reader.entity.web3.eth.getTransaction(this.currentTrxNumber).then((trx: any) => {

      // @ts-ignore
      this.inputData.reader.entity.web3.eth.getTransactionReceipt(this.currentTrxNumber).then((receipt: any) => {
        this.current = '' + trx.blockNumber;
        this.details = this.printTrx(trx, receipt);
      });
    });
  }

  public renderBlock(blockNumber: string) {
    this.currentTrxNumber = '';
    this.currentBlockNumber = blockNumber;
    this.transactions = [];

    // @ts-ignore
    this.inputData.reader.entity.web3.eth.getBlock(this.currentBlockNumber,
      (error: Error, block: any) => {

        // @ts-ignore
        this.child = (this.inputData.reader.getCurrentBlockNumber() > +this.currentBlockNumber) ? '' + (+this.currentBlockNumber + 1) : 'n.a.';
        this.current = (this.currentBlockNumber);

        this.parent = (+this.currentBlockNumber > 0) ? '' + (+this.currentBlockNumber - 1) : '0';
        this.details = this.printBlock(block);
        this.transactions = block.transactions;
      });
  }

  private printBlock(block: any) {
    return ''
      + 'Time          : ' + UtilsService.convertTimestamp(block.timestamp) + '\n'
      + 'Current hash  : ' + block.hash + '\n'
      + 'Sha3Uncles    : ' + block.sha3Uncles + '\n'
      + 'StateRoot     : ' + block.stateRoot + '\n'
      + 'Miner         : ' + block.miner + '\n'
      + 'ExtraData     : ' + block.extraData + '\n'
      + 'Size          : ' + block.size + '\n'
      + 'GasUsed       : ' + block.gasUsed + '\n'
      + 'TrxCount      : ' + block.transactions.length + '\n';
  }

  private printTrx(trx: any, receipt: any) {
    let input = '\n' + trx.input;
    const width = 3;
    for (let x = 1; (width * x) <= input.length; x++) {
      input = input.slice(0, width * x) + ' ' + input.slice(width * x);
    }
    const contractAddress = (receipt.contractAddress === null) ? 'n.a.' : receipt.contractAddress;
    return ''
      + 'Index         : ' + trx.transactionIndex + '\n'
      + 'From          : ' + trx.from + '\n'
      + 'To            : ' + ((trx.to == null) ? 'n.a.' : trx.to) + '\n'
      + 'Value         : ' + trx.value + '\n'
      + 'Nonce         : ' + trx.nonce + '\n'
      + 'Contract      : ' + contractAddress + '\n'
      + 'GasUsed       : ' + receipt.gasUsed + '\n'
      + 'GasPrice      : ' + trx.gasPrice + '\n'
      + 'CumulativeGas : ' + receipt.cumulativeGasUsed + '\n'
      + 'InputLength   : ' + trx.input.length + '\n\n'
      + input;
  }

}
