import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

export interface DialogData {
    block: string;
    transaction: string;
    content: string;
}

@Component({
    selector: "app-info-modal",
    templateUrl: "./info-modal.component.html",
    styleUrls: ["./info-modal.component.css"]
})
export class InfoModalComponent {

    constructor(
        public dialogRef: MatDialogRef<InfoModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {
    }

    onCloseClick(): void {
        this.dialogRef.close();
    }

}
