import {Component, Inject} from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogConfig,
    MatDialogRef
} from '@angular/material/dialog';
import {Reader} from "../services/reader.service";

export interface DialogData {
    blockNumber: string;
    trxNumber: string;
    reader: any;
}

@Component({
    selector: 'app-info-modal',
    templateUrl: './info-modal.component.html',
    styleUrls: ['./info-modal.component.css']
})
export class InfoModalComponent {

    constructor(public dialogRef: MatDialogRef<InfoModalComponent>,
                @Inject(MAT_DIALOG_DATA) public data: DialogData,
                public dialog: MatDialog) {
    }

    public openDetailsDialog(event: any, blockNumber: string, trxNumber: string, reader: Reader): void {

        if (event != null) {
            event.preventDefault();
        }

        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = false;
        dialogConfig.autoFocus = true;
        dialogConfig.maxWidth = '100vw';
        dialogConfig.width = '45rem';
        dialogConfig.height = '45rem';
        dialogConfig.minHeight = '20rem';
        dialogConfig.minWidth = ' 40rem';
        dialogConfig.data = {
            blockNumber: blockNumber,
            trxNumber: trxNumber,
            reader: reader
        };

        this.dialog.open(InfoModalComponent, dialogConfig);
    }

    onCloseClick(): void {
        this.dialogRef.close();
    }

}
