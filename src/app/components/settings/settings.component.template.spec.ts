import { TestBed, ComponentFixture } from '@angular/core/testing';
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

xdescribe('SettingsComponent template rendering (TestBed)', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let comp: SettingsComponent;
  let readerStub: ReaderStub;

  beforeEach(async () => {
    readerStub = new ReaderStub();
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, ReactiveFormsModule, SettingsComponent],
      providers: [{ provide: Reader, useValue: readerStub }, { provide: FormBuilder, useValue: new FormBuilder() }, { provide: ChangeDetectorRef, useValue: { detectChanges: () => {} } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    comp = fixture.componentInstance;
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
    ta.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(comp.noOfRowsAbi).toBe(15);
    ta.dispatchEvent(new Event('blur'));
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
