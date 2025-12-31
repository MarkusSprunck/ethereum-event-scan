/**
 * MIT License
 *
 * Copyright (c) 2019-2025 Markus Sprunck (sprunck.markus@gmail.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { EventsTableComponent } from './events-table.component';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { EventData, EthEvent } from '../../models/event';

class ReaderStub {
  public runningJobs = 0;
  public _cb: any;
  setUpdateCallback(cb: any) { this._cb = cb; }
}

const routeStub = { queryParams: of({}) } as any;
const dialogStub = { open: jest.fn() } as any;
const routerStub = { navigate: jest.fn() } as any;

describe('EventsTableComponent (basic)', () => {
  let comp: EventsTableComponent;
  let reader: ReaderStub;

  beforeEach(() => {
    reader = new ReaderStub();
    comp = new EventsTableComponent(new FormBuilder(), reader as any, routeStub, dialogStub as any, routerStub as any);
  });

  it('panelMessage returns No Events initially', () => {
    EventData.clear();
    expect(comp.panelMessage()).toContain('No Events');
  });

  it('showSpinner reflects reader runningJobs', () => {
    reader.runningJobs = 2;
    expect(comp.showSpinner()).toBeTruthy();
    reader.runningJobs = 0;
    expect(comp.showSpinner()).toBeFalsy();
  });

  it('applyFilter sets listData.filter', () => {
    // create a fake listData
    comp['listData'] = { filter: '', filteredData: [] } as any;
    comp.searchKey = 'abc';
    comp.applyFilter();
    expect(comp['listData'].filter).toBe('abc');
  });

  it('openDetailsDialog calls dialog.open', () => {
    comp.openDetailsDialog(null, '1', '2');
    expect(dialogStub.open).toHaveBeenCalled();
  });

  it('onResize updates screenWidth', () => {
    const original = window.innerWidth;
    try {
      (window as any).innerWidth = 500;
      comp.onResize();
      expect(comp.screenWidth).toBe(500);
    } finally {
      (window as any).innerWidth = original;
    }
  });

  it('isElementVisible returns true when paginator or listData undefined', () => {
    // default state: paginator undefined
    comp['listData'] = undefined as any;
    expect(comp.isElementVisible({})).toBeTruthy();
  });

  it('isElementVisible computes visibility with paginator and filteredData', () => {
    // create a fake paginator
    comp['listData'] = { filteredData: [{id:1},{id:2},{id:3}] } as any;
    comp['paginator'] = { pageIndex: 0, pageSize: 2 } as any;
    // element at index 0 should be visible
    expect(comp.isElementVisible(comp['listData'].filteredData[0])).toBeTruthy();
    // element at index 2 should be not visible
    expect(comp.isElementVisible(comp['listData'].filteredData[2])).toBeFalsy();
  });

  it('updateSearchValue navigates and applies filter', () => {
    comp['listData'] = { filter: '' } as any;
    comp.formSearch.get('searchKey')?.setValue('term');
    comp.updateSearchValue();
    expect(routerStub.navigate).toHaveBeenCalled();
    expect(comp.searchKey).toBe('term');
    expect(comp['listData'].filter).toBe('term');
  });

  it('panelMessage shows events count when EventData populated', () => {
    EventData.clear();
    EventData.set('1', new EthEvent('n', '1', '0x1', '', '', '', '', '', '')); // minimal event
    comp['listData'] = { filteredData: [EventData.get('1')] } as any;
    expect(comp.panelMessage()).toContain('Events');
    EventData.clear();
  });

  it('panelMessage includes jobs running count when runningJobs >= 1 (line 130)', () => {
    // Test the specific line: jobs = ' [' + this.eventReader.runningJobs + ' jobs running]';
    EventData.clear();
    comp['listData'] = { filteredData: [] } as any;

    // Set runningJobs to 1 (minimum to trigger the if condition)
    reader.runningJobs = 1;
    let message = comp.panelMessage();
    expect(message).toContain('[1 jobs running]');

    // Set runningJobs to 3 to test with multiple jobs
    reader.runningJobs = 3;
    message = comp.panelMessage();
    expect(message).toContain('[3 jobs running]');

    // Verify the exact format of the jobs string
    expect(message).toMatch(/\[3 jobs running\]/);

    EventData.clear();
  });

  it('ngOnInit registers update callback and populates listData on update', () => {
    // prepare EventData with two events so sorting works
    EventData.clear();
    EventData.set('1', new EthEvent('A', '2', '0x1', '', '', '', '', '', ''));
    EventData.set('2', new EthEvent('B', '1', '0x2', '', '', '', '', '', ''));

    // provide stubs for sort and paginator to be assigned
    comp['sort'] = {} as any;
    comp['paginator'] = {} as any;

    // call ngOnInit which will register the callback on reader
    comp.ngOnInit();
    // invoke the stored callback to simulate update
    expect(reader._cb).toBeDefined();
    reader._cb();

    // listData should be set and filteredData should contain 2 items
    expect(comp['listData']).toBeDefined();
    expect(comp['listData'].filteredData.length).toBeGreaterThanOrEqual(2);

    // filterPredicate should be defined and work
    const predicate = comp['listData'].filterPredicate as any;
    const matches = predicate({ name: 'A' }, 'a');
    expect(typeof matches).toBe('boolean');
    EventData.clear();
  });

  it('constructor sets searchKey to empty string when queryParams has no searchKey (line 72)', () => {
    // test the else branch in constructor subscription
    const routeWithoutSearchKey = { queryParams: of({}) } as any;
    const testComp = new EventsTableComponent(
      new FormBuilder(),
      reader as any,
      routeWithoutSearchKey,
      dialogStub as any,
      routerStub as any
    );
    expect(testComp.searchKey).toBe('');
  });

  it('constructor sets searchKey from queryParams when present', () => {
    const routeWithSearchKey = { queryParams: of({ searchKey: 'test-search' }) } as any;
    const testComp = new EventsTableComponent(
      new FormBuilder(),
      reader as any,
      routeWithSearchKey,
      dialogStub as any,
      routerStub as any
    );
    expect(testComp.searchKey).toBe('test-search');
  });

  it('isElementVisible uses pageSize fallback chain when pageSize is undefined (lines 130-131)', () => {
    // setup: paginator with undefined pageSize, listData with filteredData
    comp['listData'] = { filteredData: [{id:1},{id:2},{id:3}] } as any;
    comp['paginator'] = { pageIndex: 0, pageSize: undefined } as any;

    // This should trigger the fallback: pageSize ?? (this.listData.filteredData?.length ?? 0)
    // Expected: pageSize should become 3 (length of filteredData)
    const element = comp['listData'].filteredData[0];
    const result = comp.isElementVisible(element);

    // element at index 0 should be visible when pageSize falls back to filteredData.length (3)
    expect(result).toBeTruthy();
  });

  it('isElementVisible uses pageIndex fallback when pageIndex is undefined (line 150)', () => {
    // setup: paginator with undefined pageIndex
    comp['listData'] = { filteredData: [{id:1},{id:2},{id:3}] } as any;
    comp['paginator'] = { pageIndex: undefined, pageSize: 2 } as any;

    // This should trigger the fallback: pageIndex ?? 0
    // Expected: pageIndex should become 0
    const element = comp['listData'].filteredData[0];
    const result = comp.isElementVisible(element);

    // element at index 0 should be visible when pageIndex falls back to 0
    expect(result).toBeTruthy();
  });

  it('isElementVisible uses pageIndex fallback when pageIndex is null (line 150)', () => {
    // setup: paginator with null pageIndex (different from undefined)
    comp['listData'] = { filteredData: [{id:1},{id:2},{id:3}] } as any;
    comp['paginator'] = { pageIndex: null as any, pageSize: 2 } as any;

    // This should trigger the fallback: pageIndex ?? 0
    // Expected: pageIndex should become 0
    const element = comp['listData'].filteredData[0];
    const result = comp.isElementVisible(element);

    // element at index 0 should be visible when pageIndex falls back to 0
    expect(result).toBeTruthy();
  });


  it('isElementVisible uses double fallback when both pageSize and filteredData are undefined (lines 130-131)', () => {
    // setup: paginator with undefined pageSize, listData with empty filteredData array
    comp['listData'] = { filteredData: [] } as any;
    comp['paginator'] = { pageIndex: 0, pageSize: undefined } as any;

    // This should trigger fallback: pageSize ?? (this.listData.filteredData?.length ?? 0)
    // Expected: pageSize should become 0 (length of empty array)
    const result = comp.isElementVisible({});

    // With pageSize 0, maxID = -1, and indexOf({}) returns -1, so element should be invisible
    expect(result).toBeFalsy();
  });

  it('openDetailsDialog calls preventDefault when event is provided (lines 167-168)', () => {
    const mockEvent = { preventDefault: jest.fn() };
    comp.openDetailsDialog(mockEvent, '123', '0xabc');

    // verify preventDefault was called
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    // verify dialog.open was also called
    expect(dialogStub.open).toHaveBeenCalled();
  });

  it('openDetailsDialog does not crash when event is null', () => {
    // reset the spy
    dialogStub.open.mockClear();

    // This tests the if (event) branch - when event is falsy, preventDefault should not be called
    expect(() => comp.openDetailsDialog(null, '456', '0xdef')).not.toThrow();

    // verify dialog.open was still called
    expect(dialogStub.open).toHaveBeenCalled();
  });

});
