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
import { EventData } from '../../models/event';

class ReaderStub {
  public runningJobs = 0;
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
});
