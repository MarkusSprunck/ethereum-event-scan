// Consolidated settings tests: includes lightweight template rendering and unit tests
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { SettingsComponent } from './settings.component';

// Minimal Reader stub used for unit tests
class ReaderStub {
  abi = '';
  setAbi = jest.fn();
  // SettingsComponent expects setStartBlock and setEndBlock methods
  setStartBlock = jest.fn();
  setEndBlock = jest.fn();
  setStartBlockInitial = jest.fn();
  setContractAddress = jest.fn();
  reset = jest.fn();
  entity: any = { setProvider: jest.fn(), web3: null };
  isConnectionWorking = () => false;
}

// Lightweight mock component for template rendering tests
@Component({
  selector: 'app-settings-mock',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input id="provider" formControlName="provider" />
      <input id="contract" formControlName="contract" />
      <textarea id="abi" formControlName="abi"></textarea>
      <input id="start" formControlName="startBlock" />
      <input id="end" formControlName="endBlock" />
    </form>
  `
})
class MockSettingsComponent {
  public form: any;
  public noOfRowsAbi = 1;
  public reader: any = { abi: '' };
  private fb = new FormBuilder();

  constructor() {
    this.form = this.fb.group({
      provider: [''],
      contract: [''],
      abi: [''],
      startBlock: ['0'],
      endBlock: ['latest']
    });
  }

  onFocusAbi() { this.noOfRowsAbi = 15; }
  onBlurAbi() { this.noOfRowsAbi = 1; }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.form && this.form.controls['abi']) {
        this.form.controls['abi'].setValue(this.reader && (this.reader.abi || '') || '');
        try { /* simulating change detection */ } catch (e) { }
      }
    }, 0);
  }
}

describe('SettingsComponent consolidated tests', () => {
  describe('template rendering (TestBed)', () => {
    let fixture: ComponentFixture<MockSettingsComponent>;
    let comp: MockSettingsComponent;
    let readerStub: ReaderStub;

    beforeEach(async () => {
      readerStub = new ReaderStub();
      await TestBed.configureTestingModule({
        imports: [MockSettingsComponent as any],
        providers: [{ provide: FormBuilder, useValue: new FormBuilder() }, { provide: ChangeDetectorRef, useValue: { detectChanges: () => {} } }],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();

      fixture = TestBed.createComponent(MockSettingsComponent as any);
      comp = fixture.componentInstance as MockSettingsComponent;
      comp.reader = readerStub as any;
      fixture.detectChanges();
    });

    it('renders inputs and updates form on user input', () => {
      const el: HTMLElement = fixture.nativeElement;
      const providerInput = el.querySelector('#provider') as HTMLInputElement;
      expect(providerInput).toBeTruthy();
      providerInput.value = 'http://example';
      providerInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(comp.form.controls['provider'].value).toBe('http://example');

      const contractInput = el.querySelector('#contract') as HTMLInputElement;
      contractInput.value = '0x0123456789abcdef0123456789abcdef01234567';
      contractInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(comp.form.controls['contract'].value).toBe('0x0123456789abcdef0123456789abcdef01234567');
    });

    it('changes textarea rows on focus and blur', () => {
      comp.onFocusAbi();
      expect(comp.noOfRowsAbi).toBe(15);
      comp.onBlurAbi();
      expect(comp.noOfRowsAbi).toBe(1);
    });

    it('ngAfterViewInit syncs reader.abi into the form control', () => {
      jest.useFakeTimers();
      readerStub.abi = '[{"type":"event","name":"X","inputs":[]}]';
      comp.ngAfterViewInit();
      jest.advanceTimersByTime(0);
      fixture.detectChanges();
      expect(comp.form.controls['abi'].value).toBe(readerStub.abi);
      jest.useRealTimers();
    });
  });

  describe('unit tests (direct instantiation)', () => {
    let comp: SettingsComponent;
    let reader: ReaderStub;
    let cdrStub: any;

    beforeEach(() => {
      reader = new ReaderStub();
      cdrStub = { detectChanges: jest.fn() };
      // instantiate SettingsComponent directly with stubs
      comp = new SettingsComponent(new FormBuilder(), reader as any, cdrStub as any, null as any, null as any);
      // initialize form
      comp.ngOnInit();
    });

    it('should create and have default panelMessage', () => {
      expect(comp).toBeTruthy();
      expect(typeof comp.panelMessage).toBe('function');
    });

    it('updateStartValue should set startBlock via UtilsService behavior', () => {
      // call the public method which reads form control value
      comp.form.controls['startBlock'].setValue('123');
      comp.updateStartValue((comp.form.controls['startBlock'].value));
      // updateStartValue writes to internal startBlock
      expect(comp.startBlock).toBe('123');
    });

    it('updateABIValue parses JSON and calls reader.setAbi', (done) => {
      const json = JSON.stringify([{ type: 'event', name: 'E1', inputs: [] }]);
      comp.form.controls['abi'].setValue(json);
      comp.updateABIValue();
      // wait some time for async validators/timeouts if any
      setTimeout(() => {
        try {
          expect(reader.setAbi).toHaveBeenCalled();
          done();
        } catch (e) { done(e); }
      }, 600);
    });

    it('updateContractValue triggers fetchABI when provider+contract present', () => {
      comp.provider = 'http://x';
      comp.contract = '0x0123456789abcdef0123456789abcdef01234567';
      comp.form.controls['contract'].setValue(comp.contract);
      const Utils = require('../../services/utils.service').UtilsService;
      const fetchSpy = jest.spyOn(Utils, 'fetchABIFromVerifiedContract').mockImplementation((...args: any[]) => (args[1] as Function)('[{"type":"event","name":"E","inputs":[]}]'));
      comp.updateContractValue();
      expect(fetchSpy).toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

  });
});

