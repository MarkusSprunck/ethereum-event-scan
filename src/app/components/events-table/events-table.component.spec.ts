import { EventsTableComponent } from './events-table.component';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { EventData } from '../../models/event';

class ReaderStub {
  public runningJobs = 0;
  private cb: any = null;
  setUpdateCallback(cb: any) { this.cb = cb; }
  triggerUpdate() { if (this.cb) this.cb(); }
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
