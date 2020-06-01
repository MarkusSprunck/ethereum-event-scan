import {Component, HostListener, Input, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {ModalDialogComponent} from '../modal-dialog/modal-dialog.component';
import {Reader} from '../../services/reader.service';
import {EventData} from '../../models/event';
import {UtilsService} from '../../services/utils.service';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';

@Component({
    selector: 'app-events-list',
    templateUrl: './events-table.component.html',
    styleUrls: ['./events-table.component.css']
})
export class EventsTableComponent implements OnInit {

    public formSearch: FormGroup;

    listData: MatTableDataSource<any>;

    displayedColumns: string[] = ['image', 'name', 'time', 'miner', 'block', 'trxHash', 'value'];

    @ViewChild(MatSort) sort: MatSort;

    @ViewChild(MatPaginator) paginator: MatPaginator;

    @Input() searchKey = '';

    panelOpenState = false;

    screenWidth = window.innerWidth;

    constructor(private fb: FormBuilder,
                public eventReader: Reader,
                private route: ActivatedRoute,
                public detailsDialog: ModalDialogComponent) {

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

        this.eventReader.setUpdateCallback(() => {

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
            UtilsService.updateURLParameter('searchKey', val.value);
            this.searchKey = val.value;
            this.applyFilter();
        }
    }

    applyFilter() {
        this.listData.filter = this.searchKey.trim().toLowerCase();
    }

    panelMessage() {
        let jobs = '';
        if (this.eventReader.runningJobs > 1) {
            jobs = ' [' + this.eventReader.runningJobs + ' jobs running]';
        }
        let message = 'No Events';
        if (typeof EventData !== 'undefined' && typeof this.listData !== 'undefined' && EventData.size > 0) {
            message = 'Events ' + this.listData.filteredData.length + ' of ' + EventData.size + ' ' + jobs;
        }
        return message;
    }

    @HostListener('window:resize')
    onResize() {
        this.screenWidth = window.innerWidth;
    }

    isElementVisible( element: any ) {
        const minID = this.paginator.pageIndex * this.paginator.pageSize
        const maxID = (this.paginator.pageIndex + 1) * this.paginator.pageSize -1
        const elementID = this.listData.filteredData.indexOf(element)
        return  (elementID >= minID) && (elementID <= maxID)
    }

}
