import {Component, Inject} from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogConfig,
    MatDialogRef
} from '@angular/material/dialog';
import {Reader} from '../../services/reader.service';
import {SettingsComponent} from "../settings/settings.component";
import {UtilsService} from "../../services/utils.service";

export interface DialogData {
    blockNumber: string;
    trxNumber: string;
    reader: any;
}

@Component({
    selector: 'app-info-modal',
    templateUrl: './modal-dialog.component.html',
    styleUrls: ['./modal-dialog.component.css']
})
export class ModalDialogComponent {

    private blockNumber: String = "";

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
        dialogConfig.maxWidth = '100vw';
        dialogConfig.width = '45rem';
        dialogConfig.height = '45rem';
        dialogConfig.minHeight = '20rem';
        dialogConfig.minWidth = ' 40rem';
        dialogConfig.data = {
            blockNumber,
            trxNumber,
            reader
        };

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
}
