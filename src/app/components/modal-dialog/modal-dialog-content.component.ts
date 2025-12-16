import {Component, Input, OnInit, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UtilsService} from '../../services/utils.service';
import {DialogData} from './modal-dialog.component';
import {MatListModule} from '@angular/material/list';

@Component({
  selector: 'app-inner-component',
  standalone: true,
  imports: [CommonModule, MatListModule],
  templateUrl: './modal-dialog-content.component.html',
  styleUrls: ['./modal-dialog-content.component.scss']
})
export class ModalDialogContentComponent implements OnInit {

  constructor(private cdr: ChangeDetectorRef) {}

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

    console.debug('ModalDialogContentComponent ngOnInit, inputData=', this.inputData);

    // @ts-ignore
    if (this.inputData && this.inputData.trxNumber != null && this.inputData.trxNumber.length > 0) {

      // @ts-ignore
      this.renderTransaction(this.inputData.trxNumber);
    } else {

      // @ts-ignore
      this.renderBlock(this.inputData ? this.inputData.blockNumber : '');
    }
  }

  public renderTransaction(trxNumber: string) {
    console.debug('renderTransaction called with', trxNumber);
    this.currentTrxNumber = trxNumber;
    this.currentBlockNumber = '';
    this.transactions = [];

    if (!this.inputData || !this.inputData.reader || !this.inputData.reader.entity || !this.inputData.reader.entity.web3) {
      console.warn('No reader/web3 available for renderTransaction');
      return;
    }

    // @ts-ignore
    this.inputData.reader.entity.web3.eth.getTransaction(this.currentTrxNumber).then((trx: any) => {

      // @ts-ignore
      this.inputData.reader.entity.web3.eth.getTransactionReceipt(this.currentTrxNumber).then((receipt: any) => {
        this.current = '' + trx.blockNumber;
        this.details = this.printTrx(trx, receipt);
        this.cdr.detectChanges();
      }).catch((err: any) => { console.error('getTransactionReceipt failed', err); });
    }).catch((err: any) => { console.error('getTransaction failed', err); });
  }

  public renderBlock(blockNumber: string) {
    console.debug('renderBlock called with', blockNumber);
    this.currentTrxNumber = '';
    this.currentBlockNumber = blockNumber;
    this.transactions = [];

    if (!this.inputData || !this.inputData.reader || !this.inputData.reader.entity || !this.inputData.reader.entity.web3) {
      console.warn('No reader/web3 available for renderBlock');
      return;
    }

    // Use Promise-based API instead of callback (second parameter must be boolean in web3 v4)
    // @ts-ignore
    this.inputData.reader.entity.web3.eth.getBlock(this.currentBlockNumber)
      .then((block: any) => {
        // @ts-ignore
        this.child = (this.inputData && this.inputData.reader.getCurrentBlockNumber() > +this.currentBlockNumber) ? '' + (+this.currentBlockNumber + 1) : 'n.a.';
        this.current = (this.currentBlockNumber);
        this.parent = (+this.currentBlockNumber > 0) ? '' + (+this.currentBlockNumber - 1) : '0';
        // UtilsService.patchMinerAccountClique(block); // removed: no longer needed
        this.details = this.printBlock(block);
        this.transactions = block.transactions;
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error fetching block:', err);
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
