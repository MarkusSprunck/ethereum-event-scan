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

import {Injectable, PipeTransform} from '@angular/core';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {DecimalPipe} from '@angular/common';
import {debounceTime, delay, switchMap, tap} from 'rxjs/operators';
import {SortDirection} from './sortable-header';
import {EventData} from "../services/event-data";
import {Event} from '../services/event';

interface SearchResult {
    countries: Event[];
    total: number;
}

interface State {
    page: number;
    pageSize: number;
    searchTerm: string;
    sortColumn: string;
    sortDirection: SortDirection;
}

function compare(v1, v2) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
}

function sort(events: Event[], column: string, direction: string): Event[] {
    if (direction === '') {
        return events;
    } else {
        return [...events].sort((a, b) => {
            const res = compare(a[column], b[column]);
            return direction === 'asc' ? res : -res;
        });
    }
}

function matches(event: Event, term: string, pipe: PipeTransform) {
    return event.name.toLowerCase().includes(term.toLowerCase())
        || event.trxHash.includes(term)
        || event.block.includes(term)
        || event.key.includes(term)
        || event.value.includes(term)
        || pipe.transform(event.id).includes(term);
}

@Injectable({providedIn: 'root'})
export class EventsService {
    length: number = 0;
    lengthLast: number = -1;
    private _search$ = new Subject<void>();
    private _state: State = {
        page: 1,
        pageSize: 10,
        searchTerm: '',
        sortColumn: '',
        sortDirection: ''
    };

    constructor(private pipe: DecimalPipe) {

        this.length  = 0;
        this.lengthLast = -1;

        setInterval(() => {
            if (this.lengthLast <  EventData.length || this.lengthLast === -1 || this.length === 0) {
                this.updateSearchPipe();
                this.lengthLast = EventData.length;
            }
        }, 1000);
    }

    private _loading$ = new BehaviorSubject<boolean>(true);

    get loading$() {
        return this._loading$.asObservable();
    }

    private _events$ = new BehaviorSubject<Event[]>([]);

    get events$() {
        return this._events$.asObservable();
    }

    private _total$ = new BehaviorSubject<number>(0);

    get total$() {
        return this._total$.asObservable();
    }

    get page() {
        return this._state.page;
    }

    set page(page: number) {
        this._set({page});
    }

    get pageSize() {
        return this._state.pageSize;
    }

    set pageSize(pageSize: number) {
        this._set({pageSize});
    }

    get searchTerm() {
        return this._state.searchTerm;
    }

    set searchTerm(searchTerm: string) {
        this._set({searchTerm});
    }

    set sortColumn(sortColumn: string) {
        this._set({sortColumn});
    }

    set sortDirection(sortDirection: SortDirection) {
        this._set({sortDirection});
    }

    public updateSearchPipe() {
        this._search$.pipe(
            tap(() => this._loading$.next(true)),
            debounceTime(200),
            switchMap(() => this._search()),
            delay(200),
            tap(() => this._loading$.next(false))
        ).subscribe(result => {
            this._events$.next(result.countries);
            this._total$.next(result.total);
            this.length = result.total;
            this._search();

        });
        this._search$.next();
    }

    private _set(patch: Partial<State>) {
        Object.assign(this._state, patch);
        this._search$.next();
    }

    private _search(): Observable<SearchResult> {
        const {sortColumn, sortDirection, pageSize, page, searchTerm} = this._state;

        // 1. sort
        let events = sort(EventData, sortColumn, sortDirection);

        // 2. filter
        events = events.filter(event => matches(event, searchTerm, this.pipe));
        const total = events.length;

        // 3. paginate
        events = events.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
        return of({countries: events, total});
    }

}
