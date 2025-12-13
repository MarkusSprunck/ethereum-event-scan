import {Component, HostListener, Input, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {Reader} from '../../services/reader.service';
import {EventData} from '../../models/event';
import {UtilsService} from '../../services/utils.service';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {EventsListResponsiveDirective} from './directives/events-list-responsive.directive';
import {HighlightSearch} from './pipes/highlight-search.pipe';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    CommonModule,
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

  // @ts-ignore
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
              private dialog: MatDialog) {

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

      // @ts-ignore
      this.listData.sort = this.sort;

      // @ts-ignore
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
    if (this.eventReader.runningJobs >= 1) {
      jobs = ' [' + this.eventReader.runningJobs + ' jobs running]';
    }
    let message = 'No Events';
    if (typeof EventData !== 'undefined' && typeof this.listData !== 'undefined' && EventData.size > 0) {
      message = 'Events ' + this.listData.filteredData.length + ' of ' + EventData.size ;
    }
    return message + ' ' + jobs;
  }

  @HostListener('window:resize')
  onResize() {
    this.screenWidth = window.innerWidth;
  }

  isElementVisible(element: any) {

    // @ts-ignore
    const minID = this.paginator.pageIndex * this.paginator.pageSize

    // @ts-ignore
    const maxID = (this.paginator.pageIndex + 1) * this.paginator.pageSize - 1

    // @ts-ignore
    const elementID = this.listData.filteredData.indexOf(element)
    return (elementID >= minID) && (elementID <= maxID)
  }

  showSpinner() {
    return this.eventReader.runningJobs > 0;
  }

  public openDetailsDialog(event: any, blockNumber: string, trxNumber: string) {
    if (event) { event.preventDefault(); }

    console.debug('EventsTable.openDetailsDialog called with', {blockNumber, trxNumber, reader: this.eventReader});

    this.dialog.open((require('../modal-dialog/modal-dialog.component') as any).ModalDialogComponent, {
      data: { blockNumber, trxNumber, reader: this.eventReader },
      width: '50rem',
      height: '50rem',
      maxWidth: '100vw'
    });
  }
}
