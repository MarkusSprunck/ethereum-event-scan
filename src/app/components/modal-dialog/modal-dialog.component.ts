import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogModule,
    MatDialogRef
} from '@angular/material/dialog';
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

    onCloseClick(): void {
        this.dialogRef.close();
    }

}
