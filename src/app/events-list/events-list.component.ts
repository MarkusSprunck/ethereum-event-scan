import {Component, HostListener, Input, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {InfoModalComponent} from '../details/info-modal.component';
import {Reader} from '../services/reader.service';
import {EventData} from '../services/event';
import {UtilsService} from "../services/utils.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: 'app-events-list',
    templateUrl: './events-list.component.html',
    styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit {

    public formSearch: FormGroup;

    listData: MatTableDataSource<any>;

    displayedColumns: string[] = ['image', 'name', 'block', 'trxHash', 'value'];

    @ViewChild(MatSort) sort: MatSort;

    @ViewChild(MatPaginator) paginator: MatPaginator;

    @Input() searchKey: string = '';

    panelOpenState = false;

    screenWidth = window.innerWidth;

    constructor(private fb: FormBuilder,
                private reader: Reader,
                public dialog: MatDialog,
                private route: ActivatedRoute) {

        this.route.queryParams.subscribe(params => {
            if (params.searchKey) {
                this.searchKey = params.searchKey;
            } else {
                this.searchKey = '';
            }
        });
    }

    ngOnInit() {

        this.formSearch = this.fb.group({
            searchKey: [''],
        });

        this.reader.setUpdateCallback(() => {

            const sortedEvents = Array.from(EventData.values())
                .sort((first, second) => {
                    return Number(second.block) - Number(first.block);
                });

            this.panelOpenState = true;

            this.listData = new MatTableDataSource([...sortedEvents]);
            this.listData.sort = this.sort;
            this.listData.paginator = this.paginator;
            this.listData.filter = this.searchKey;
            this.listData.filterPredicate = (data, filter) => {
                return this.displayedColumns.some(ele => {
                    return data[ele].toLowerCase().indexOf(filter) !== -1;
                });
            };
        });

    }

    updateSearchValue() {
        const val = this.formSearch.get('searchKey');
        if (val) {
            console.log('searchKey =>', this.searchKey, ' -> ', val);
            UtilsService.updateURLParameter('searchKey', this.searchKey, val.value);
            this.searchKey = val.value;
            this.applyFilter();
        }
    }

    applyFilter() {
        this.listData.filter = this.searchKey.trim().toLowerCase();
    }

    openDetailsDialog(event: any, blockNumber: string, trxNumber: string): void {

        if (event != null) {
            event.preventDefault();
        }

        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = false;
        dialogConfig.autoFocus = true;
        dialogConfig.maxWidth = '90vw';
        dialogConfig.maxHeight = '90vh';

        if (blockNumber != null && blockNumber.length > 0) {
            const that = this;
            this.reader.entity.web3.eth.getBlock(blockNumber,
                (error: Error, block: any) => {
                    dialogConfig.data = {
                        block: blockNumber,
                        transaction: trxNumber,
                        content: InfoModalComponent.printBlock(block, that.reader.getCurrentBlockNumber())
                    };
                    that.dialog.open(InfoModalComponent, dialogConfig);
                });
        }

        if (trxNumber != null && trxNumber.length > 0) {
            const that = this;
            this.reader.entity.web3.eth.getTransaction(trxNumber).then((tx: any) => {
                this.reader.entity.web3.eth.getTransactionReceipt(trxNumber).then((receipt: any) => {
                    dialogConfig.data = {
                        block: blockNumber,
                        transaction: trxNumber,
                        content: InfoModalComponent.printTrx(tx, receipt)
                    };
                    that.dialog.open(InfoModalComponent, dialogConfig);
                });
            });
        }
    }

    panelMessage() {
        let jobs = '';
        if (this.reader.runningJobs > 1) {
            jobs = ' [' + this.reader.runningJobs + ' jobs running]';
        }
        let message = 'No Events';
        if (EventData.size > 0) {
            message = 'Events ' + this.listData.filteredData.length + ' of ' + EventData.size + ' ' + jobs;
        }
        return message;
    }


    @HostListener('window:resize')
    onResize() {
        this.screenWidth = window.innerWidth;
    }

}
