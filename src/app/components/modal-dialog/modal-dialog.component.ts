import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef, MatDialogModule} from '@angular/material/dialog';
import {Reader} from '../../services/reader.service';
import {MatButtonModule} from '@angular/material/button';
import {ModalDialogContentComponent} from './modal-dialog-content.component';

export interface DialogData {
  blockNumber: string;
  trxNumber: string;
  reader: any;
}

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, ModalDialogContentComponent],
  templateUrl: './modal-dialog.component.html',
  styleUrls: ['./modal-dialog.component.scss']
})
export class ModalDialogComponent {

   constructor(public dialogRef: MatDialogRef<ModalDialogComponent>,
               @Inject(MAT_DIALOG_DATA) public data: DialogData,
               public dialog: MatDialog) {
   }

   public openDetailsDialog(event: any, blockNumber: string, trxNumber: string, reader: Reader): void {

     if (event != null) {
       event.preventDefault();
     }

     // Open dialog with a concise config object. Keep the same sizes as before.
     const config: MatDialogConfig = {
       disableClose: false,
       autoFocus: true,
       maxWidth: '90vw',
       width: '50rem',
       height: '45rem',
       minHeight: '20rem',
       minWidth: '10rem',
       data: { blockNumber, trxNumber, reader }
     };

     this.dialog.open(ModalDialogComponent, config);
   }

   onCloseClick(): void {
     this.dialogRef.close();
   }

}
