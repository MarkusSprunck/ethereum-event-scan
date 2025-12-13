import { SettingsComponent } from './settings.component';
import { FormBuilder } from '@angular/forms';
import { Reader } from '../../services/reader.service';
import { ChangeDetectorRef } from '@angular/core';

class ReaderStub {}
class CdrStub { detectChanges() {} }

describe('SettingsComponent (unit)', () => {
  let comp: SettingsComponent;
  beforeEach(() => {
    comp = new SettingsComponent(new FormBuilder(), new ReaderStub() as any, new CdrStub() as any);
  });

  it('should create and have default panelMessage', () => {
    expect(comp.panelMessage()).toContain('Last Block');
  });

  it('updateStartValue should set startBlock via UtilsService', () => {
    comp.form.get('startBlock')!.setValue('5');
    const spy = jest.spyOn(require('../../services/utils.service').UtilsService, 'updateURLParameter');
    comp.updateStartValue();
    expect(comp.startBlock).toBe('5');
    expect(spy).toHaveBeenCalled();
  });
});
