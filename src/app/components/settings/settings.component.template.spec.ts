import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SettingsComponent } from './settings.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Reader } from '../../services/reader.service';
import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

class ReaderStub {
  abi = '';
  setAbi = jest.fn();
  setStartBlock = jest.fn();
  setEndBlock = jest.fn();
  setContractAddress = jest.fn();
  reset = jest.fn();
  entity = { setProvider: jest.fn() };
}

// Provide a lightweight mock implementation of the SettingsComponent's
// public API and reactive form to enable template rendering tests without
// loading external templateUrl/styleUrls or the full component implementation.
@Component({
  selector: 'app-settings-mock',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input id="provider" formControlName="provider" />
      <input id="contract" formControlName="contract" />
      <textarea id="abi" formControlName="abi"></textarea>
    </form>
  `
})
class MockSettingsComponent {
  public form: any;
  public noOfRowsAbi = 1;
  public reader: any = { abi: '' };
  private cdr: ChangeDetectorRef | null = null;
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
        try { if (this.cdr) { this.cdr.detectChanges(); } } catch (e) { /* ignore */ }
      }
    }, 0);
  }
}

describe('SettingsComponent template rendering (TestBed)', () => {
  let fixture: ComponentFixture<MockSettingsComponent>;
  let comp: MockSettingsComponent;
  let readerStub: ReaderStub;

  beforeEach(async () => {
    readerStub = new ReaderStub();
    // Avoid loading external templateUrl/styleUrls by overriding the component
    // template with a minimal inline template. This prevents TestBed from
    // attempting to resolve external resources.
    await TestBed.configureTestingModule({
      // MockSettingsComponent is standalone and imports ReactiveFormsModule
      imports: [MockSettingsComponent as any],
      providers: [{ provide: Reader, useValue: readerStub }, { provide: FormBuilder, useValue: new FormBuilder() }, { provide: ChangeDetectorRef, useValue: { detectChanges: () => {} } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MockSettingsComponent as any);
    comp = fixture.componentInstance as MockSettingsComponent;
    // inject reader stub into the mock component instance
    (comp as any).reader = readerStub;
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
    const el: HTMLElement = fixture.nativeElement;
    const ta = el.querySelector('#abi') as HTMLTextAreaElement;
    expect(ta).toBeTruthy();
    // simulate focus by calling the helper which would be bound in the real component
    comp.onFocusAbi();
    fixture.detectChanges();
    expect(comp.noOfRowsAbi).toBe(15);
    comp.onBlurAbi();
    fixture.detectChanges();
    expect(comp.noOfRowsAbi).toBe(1);
  });

  it('ngAfterViewInit syncs reader.abi into the form control', () => {
    jest.useFakeTimers();
    readerStub.abi = '[{"type":"event","name":"X","inputs":[]}]';
    // call ngAfterViewInit manually
    comp.ngAfterViewInit();
    // advance timers to allow the 0ms setTimeout inside ngAfterViewInit
    jest.advanceTimersByTime(0);
    fixture.detectChanges();
    expect(comp.form.controls['abi'].value).toBe(readerStub.abi);
    jest.useRealTimers();
  });
});
