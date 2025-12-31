import {Component, HostListener, Input, OnInit, ViewChild} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {Reader} from '../../services/reader.service';
import {EventData} from '../../models/event';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {
    EventsListResponsiveDirective
} from './directives/events-list-responsive.directive';
import {HighlightSearch} from './pipes/highlight-search.pipe';
import {MatDialog} from '@angular/material/dialog';

@Component({
    selector: 'app-events-list',
    standalone: true,
    imports: [
        CommonModule,
        NgOptimizedImage,
        ReactiveFormsModule,
        MatExpansionModule,
        MatProgressBarModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        EventsListResponsiveDirective,
        HighlightSearch
    ],
    templateUrl: './events-table.component.html',
    styleUrls: ['./events-table.component.scss']
})
export class EventsTableComponent implements OnInit {

    public formSearch: FormGroup;

    listData!: MatTableDataSource<any>;

    displayedColumns: string[] = ['image', 'name', 'time', 'miner', 'block', 'trxHash', 'value'];

    @ViewChild(MatSort) sort: MatSort | undefined;

    @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

    @Input() searchKey = '';

    panelOpenState = false;

    screenWidth = window.innerWidth;

    constructor(private fb: FormBuilder,
                public eventReader: Reader,
                private route: ActivatedRoute,
                private dialog: MatDialog,
                private router: Router) {

        // ensure definite assignment for strict checks
        this.formSearch = this.fb.group({searchKey: ['']});

        this.route.queryParams.subscribe(params => {
            if (params['searchKey']) {
                this.searchKey = params['searchKey'];
            } else {
                this.searchKey = '';
            }
        });
    }

    ngOnInit() {

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
            this.listData.filterPredicate = (data: any, filter: string) => {
                return this.displayedColumns.some((ele: string) => {
                    const v = data[ele];
                    if (v === undefined || v === null) return false;
                    return String(v).toLowerCase().indexOf(filter) !== -1;
                });
            };
        });

    }

    updateSearchValue() {
        const val = this.formSearch.get('searchKey');
        if (val) {
            void this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {searchKey: val.value},
                queryParamsHandling: 'merge'
            });
            this.searchKey = val.value;
            this.applyFilter();
        }
    }

    applyFilter() {
        this.listData.filter = this.searchKey.trim().toLowerCase();
    }

    panelMessage() {
        let jobs = '';
        if (this.eventReader.runningJobs >= 1) {
            jobs = ' [' + this.eventReader.runningJobs + ' jobs running]';
        }
        let message = 'No Events';
        if (typeof EventData !== 'undefined' && typeof this.listData !== 'undefined' && EventData.size > 0) {
            message = 'Events ' + this.listData.filteredData.length + ' of ' + EventData.size;
        }
        return message + ' ' + jobs;
    }

    @HostListener('window:resize')
    onResize() {
        this.screenWidth = window.innerWidth;
    }

    isElementVisible(element: any) {

        // guard against undefined paginator/listData (strict mode)
        if (!this.paginator || !this.listData) {
            return true;
        }

        const pageIndex = this.paginator.pageIndex ?? 0;
        const pageSize = this.paginator.pageSize ?? (this.listData.filteredData?.length ?? 0);

        const minID = pageIndex * pageSize;
        const maxID = (pageIndex + 1) * pageSize - 1;

        const elementID = this.listData.filteredData.indexOf(element);
        return (elementID >= minID) && (elementID <= maxID);
    }

    showSpinner() {
        return this.eventReader.runningJobs > 0;
    }

    public openDetailsDialog(event: any, blockNumber: string, trxNumber: string) {
        if (event) {
            event.preventDefault();
        }
        this.dialog.open((require('../modal-dialog/modal-dialog.component') as any).ModalDialogComponent, {
            data: {blockNumber, trxNumber, reader: this.eventReader},
            width: '50rem',
            height: '50rem',
            maxWidth: '100vw'
        });
    }
}
