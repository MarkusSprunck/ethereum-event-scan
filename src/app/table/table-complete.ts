/**
 * MIT License
 *
 * Copyright (c) 2019-2020 Markus Sprunck (sprunck.markus@gmail.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {DecimalPipe} from '@angular/common';
import {Component, QueryList, ViewChildren} from '@angular/core';
import {Observable} from 'rxjs';

import {Event} from '../services/event';
import {EventsService} from './events-service';
import {SortableHeader, SortEvent} from './sortable-header';
import {InfoModalComponent} from "../details/info-modal.component";
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";

@Component(
    {
        selector: 'table-complete',
        templateUrl: './table-complete.html',
        styleUrls:['./table-complete.css'],
        providers: [EventsService, DecimalPipe]
    })
export class TableComplete {

    events$: Observable<Event[]>;

    total$: Observable<number>;

    @ViewChildren(SortableHeader) headers: QueryList<SortableHeader>;

    constructor(public service: EventsService,
                public dialog: MatDialog) {
        this.events$ = service.events$;
        this.total$ = service.total$;
    }

    onSort({column, direction}: SortEvent) {

        // resetting other headers
        this.headers.forEach(header => {
            if (header.sortable !== column) {
                header.direction = '';
            }
        });

        this.service.sortColumn = column;
        this.service.sortDirection = direction;
    }

    openInfoDialog(event: any, block: string, trx: string): void {
        event.preventDefault();
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = false;
        dialogConfig.autoFocus = true;
        dialogConfig.width = "70vw";
        dialogConfig.data = {
            "block": block,
            "transaction": trx
        };
        this.dialog.open(InfoModalComponent, dialogConfig);
    }


}


