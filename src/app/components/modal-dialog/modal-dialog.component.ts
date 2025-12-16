import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef, MatDialogModule} from '@angular/material/dialog';
import {Reader} from '../../services/reader.service';
import {UtilsService} from "../../services/utils.service";
import {MatButtonModule} from '@angular/material/button';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatListModule} from '@angular/material/list';
import {ModalDialogContentComponent} from './modal-dialog-content.component';

export interface DialogData {
  blockNumber: string;
  trxNumber: string;
  reader: any;
}

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatGridListModule, MatListModule, ModalDialogContentComponent],
  templateUrl: './modal-dialog.component.html',
  styleUrls: ['./modal-dialog.component.scss']
})
export class ModalDialogComponent {

  private blockNumber = '';

  constructor(public dialogRef: MatDialogRef<ModalDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData,
              public dialog: MatDialog) {
  }

  public openDetailsDialog(event: any, blockNumber: string, trxNumber: string, reader: Reader): void {

    this.blockNumber = blockNumber;

    if (event != null) {
      event.preventDefault();
    }

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.maxWidth = '90vw';
    dialogConfig.width = '50rem';
    dialogConfig.height = '45rem';
    dialogConfig.minHeight = '20rem';
    dialogConfig.minWidth = ' 10rem';
    dialogConfig.data = {
      blockNumber,
      trxNumber,
      reader
    };

    console.debug('Opening details dialog with data:', dialogConfig.data);

    this.dialog.open(ModalDialogComponent, dialogConfig);
  }

  onCloseClick(): void {
    this.dialogRef.close();
  }

  onPinStart() {
    UtilsService.updateURLParameter('start', this.data.blockNumber);
    this.data.reader.setStartBlocktInitial(this.data.blockNumber)
    location.reload();
  }


  onPinEnd() {
    UtilsService.updateURLParameter('end', this.data.blockNumber);
    this.data.reader.setEndBlock(this.data.blockNumber);
    location.reload();
  }

  onPinStartEnd() {
    UtilsService.updateURLParameter('start', this.data.blockNumber);
    this.data.reader.setStartBlocktInitial(this.data.blockNumber)
    UtilsService.updateURLParameter('end', this.data.blockNumber);
    this.data.reader.setEndBlock(this.data.blockNumber);
    location.reload();
  }
}
