/**
 * MIT License
 *
 * Copyright (c) 2019-2020 Markus Sprunck (sprunck.markus@gmail.com)
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

import {Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';
import {UtilsService} from '../../services/utils.service';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {TextFieldModule} from '@angular/cdk/text-field';
import {Reader} from '../../services/reader.service';
import stringify from 'json-stringify-pretty-compact';
import { JsonFormatterDirective } from './directives/json-formatter.directive';

interface AbiEntry {
   anonymous?: boolean;
   inputs: any[];
   name: string;
   type: string;
}

export class AbiErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null): boolean {
    if (!control) return false;
    const isInvalid = control.invalid;
    const isTouchedOrDirty = !!(control.touched || control.dirty);
    const isPending = !!control.pending;
    return isInvalid && isTouchedOrDirty && !isPending;
  }
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule, TextFieldModule, JsonFormatterDirective],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnChanges, AfterViewInit {

  public form: FormGroup;
  public abiErrorStateMatcher = new AbiErrorStateMatcher();
  private _lastSeenReaderAbi = '';

  @Input() public lastBlock = 0;
  @Input() public startBlock = '';
  @Input() public endBlock = '';
  @Input() public abi = '';
  @Input() public contract = '';
  @Input() public provider = '';
  @Input() public connected = false;

  panelOpenState = true;

  noOfRowsAbi = 1;

  constructor(private fb: FormBuilder,
              private reader: Reader,
              private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({
      provider: [this.provider || '', [Validators.required], this.isProviderConnected.bind(this)],
      contract: [this.contract || '', [Validators.required], this.isContractOk.bind(this)],
      abi: [this.abi || '', [Validators.required], this.isABIOk.bind(this)],
      startBlock: [this.startBlock || '0', [Validators.required], this.isStartBlockOk.bind(this)],
      lastBlock: [this.lastBlock || ''],
      endBlock: [this.endBlock || 'latest', [Validators.required], this.isEndBlockOk.bind(this)]
    }, { updateOn: 'blur' });
  }

  panelMessage() {
    return ('Last Block ' + this.lastBlock + '');
  }

  isProviderConnected(control: AbstractControl) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // use control.value if available
        const val = (control && control.value) ? control.value : this.provider;
        if (this.connected || (typeof val === 'string' && val.trim().length > 0 && this.connected)) {
          resolve(null);
        } else {
          resolve({connected: false});
        }
      }, 6000);
    });
  }

  isContractOk(control: AbstractControl) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const candidate = (control && control.value) ? control.value : this.contract;
        const regexPattern = /0x[0-9A-Fa-f]{40}/;
        const match = (candidate || '').match(regexPattern);
        if (match && candidate === match[0]) {
          resolve(null);
        } else {
          resolve({connected: false});
        }
      }, 500);
    });
  }

  isABIOk(control: AbstractControl) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const candidate = (control && control.value) ? control.value : this.abi;
        try {
          JSON.parse(candidate);
          resolve(null);
        } catch (e) {
          resolve({abi_ok: false});
        }
      }, 500);
    });
  }

  isStartBlockOk(control: AbstractControl) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const candidate = (control && control.value) ? control.value : this.startBlock;
        const regexPattern = /^[0-9]+$/;
        const match = (candidate || '').match(regexPattern);
        if (match && candidate === match[0]) {
          resolve(null);
        } else {
          resolve({isEndBlockValid: false});
        }
      }, 500);
    });
  }

  isEndBlockOk(control: AbstractControl) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const candidate = (control && control.value) ? control.value : this.endBlock;
        const regexPattern = /^[0-9]+$/;
        const match = (candidate || '').match(regexPattern);
        if (match && candidate === match[0]) {
          resolve(null);
        } else if (typeof candidate === 'string' && candidate.toUpperCase() === 'LATEST') {
          resolve(null);
        } else {
          resolve({isEndBlockValid: false});
        }
      }, 500);
    });
  }

  updateStartValue() {
    const val = this.form.get('startBlock');
    if (val) {
      const result: string = (val.value.length === 0) ? '0' : val.value;
      UtilsService.updateURLParameter('start', result);
      this.startBlock = result;
    }
  }

  updateProviderValue() {
    const val = this.form.get('provider');
    if (val) {
      UtilsService.updateURLParameter('provider', val.value);
      this.provider = val.value.trim();

      this.form.controls['provider'].clearValidators();
      this.loadContractData();
    }
  }

  updateEndValue() {
    const val = this.form.get('endBlock');
    if (val) {
      UtilsService.updateURLParameter('end', val.value);
      this.endBlock = val.value;
      this.loadContractData();
    }
  }

  updateContractValue() {
    const val = this.form.get('contract');
    if (val) {
      if (this.provider.length > 0 && val.value.trim() > 0 && this.abi.length === 0) {
        UtilsService.fetchABIFromVerifiedContract(val.value.trim(), (value: string) => {
            this.form.controls['abi'].setValue(value);
            this.updateContract(val.value);
          }
        );
      } else {
        this.updateContract(val.value);
      }
    }
  }

  updateABIValue(value?: string) {
    const controlValue = (typeof value === 'string') ? value : (this.form.get('abi') ? this.form.get('abi')!.value : '');
    if (controlValue !== undefined) {
      if (this.provider.length > 0 && this.contract.trim().length > 0 && controlValue.trim().length === 0) {

        UtilsService.fetchABIFromVerifiedContract(this.contract.trim(), (val: string) => {
            UtilsService.updateURLWithCompressedAbi(val);
            this.form.controls['abi'].setValue(val);
            this.abi = val;
            // clear errors since we just set a valid abi
            this.form.controls['abi'].setErrors(null);
            setInterval(this.reloadPage, 500);
          }
        );
      } else {
        try {
          const objAbi: AbiEntry[]  = JSON.parse(controlValue);
          const filteredData: AbiEntry[] = (objAbi.filter((abiEntry) => abiEntry.type === 'event'));
          filteredData.forEach(function (v) {
             delete v['anonymous'];
          });
          this.abi = stringify(filteredData);

          UtilsService.updateURLWithCompressedAbi(this.abi);
          this.loadContractData();
          // clear errors on successful parse
          this.form.controls['abi'].setErrors(null);
          setInterval(this.reloadPage, 1000);
        } catch (e) {
          // invalid JSON — mark control as invalid manually
          this.form.controls['abi'].setErrors({json: true});
        }
      }
    }
  }

  onBlurAbi() {
    this.noOfRowsAbi = 1;
  }

  onFocusAbi() {
    this.noOfRowsAbi = 15;
  }

  reloadPage() {
    location.reload();
  }

  ngOnInit(): void {
    // Initialize form controls from @Input properties so the template shows current values
    try {
      this.form.patchValue({
        provider: this.provider || '',
        contract: this.contract || '',
        abi: this.abi || '',
        startBlock: this.startBlock || '0',
        endBlock: this.endBlock || 'latest'
      });

      // Keep component.abi and native textarea in sync with the form control
      try {
        const abiControl = this.form.controls['abi'];
        if (abiControl) {
          abiControl.valueChanges.subscribe((v: any) => {
            try {
              this.abi = v || '';
              const ta = document.getElementById('abi') as HTMLTextAreaElement | null;
              if (ta && ta.value !== this.abi) { ta.value = this.abi; }
            } catch (e) { /* ignore DOM errors */ }
          });
        }
      } catch (e) { /* ignore subscription errors */ }

    } catch (e) {
      console.warn('Failed to patch settings form initial values', e);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If any input changes after initialization, update the form controls accordingly
    if (!this.form) {
      return;
    }
    const patch: any = {};
    if (changes['provider'] && typeof changes['provider'].currentValue !== 'undefined') {
      patch.provider = changes['provider'].currentValue || '';
    }
    if (changes['contract'] && typeof changes['contract'].currentValue !== 'undefined') {
      patch.contract = changes['contract'].currentValue || '';
    }
    if (changes['abi'] && typeof changes['abi'].currentValue !== 'undefined') {
      patch.abi = changes['abi'].currentValue || '';
    }
    if (changes['startBlock'] && typeof changes['startBlock'].currentValue !== 'undefined') {
      patch.startBlock = changes['startBlock'].currentValue || '0';
    }
    if (changes['endBlock'] && typeof changes['endBlock'].currentValue !== 'undefined') {
      patch.endBlock = changes['endBlock'].currentValue || 'latest';
    }
    if (Object.keys(patch).length > 0) {
      try { this.form.patchValue(patch); } catch (e) { console.warn('Failed to patch form on changes', e); }
    }
  }

  ngAfterViewInit(): void {
    // Ensure the ABI form control reflects the current @Input value after the view initializes
    try {
      setTimeout(() => {
        if (this.form && this.form.controls['abi']) {
          this.form.controls['abi'].setValue(this.abi || (this.reader && (this.reader.abi || '')) || '');
        }
        this.cdr.detectChanges();
        try {
          const ta = document.getElementById('abi') as HTMLTextAreaElement | null;
          if (ta && this.form && this.form.controls['abi']) {
            ta.value = this.form.controls['abi'].value || '';
          }
        } catch (e) { /* ignore DOM errors */ }
      }, 0);

      // Poll reader.abi for a short period in case it is set asynchronously after component init
      const start = Date.now();
      const maxMs = 8000; // stop polling after 8s
      const interval = setInterval(() => {
        try {
          const readerAbi = (this.reader && this.reader.abi) ? this.reader.abi : '';
          if (readerAbi && readerAbi !== this._lastSeenReaderAbi) {
            this._lastSeenReaderAbi = readerAbi;
            if (this.form && this.form.controls['abi'] && this.form.controls['abi'].value !== readerAbi) {
              this.form.controls['abi'].setValue(readerAbi);
              this.cdr.detectChanges();
            }
            clearInterval(interval);
            return;
          }
          if (Date.now() - start > maxMs) { clearInterval(interval); }
        } catch (e) {
          clearInterval(interval);
        }
      }, 250);

    } catch (e) {
      console.warn('Failed to set ABI after view init', e);
    }
  }

  private loadContractData() {
    if (this.abi !== undefined) {
      this.reader.setAbi(this.abi);
    }
    if (this.startBlock !== undefined) {
      this.reader.setStartBlock(this.startBlock);
    }
    if (this.endBlock !== undefined) {
      this.reader.setEndBlock(this.endBlock);
    }
    if (this.contract !== undefined) {
      this.reader.setContractAddress(this.contract);
    }
    if (this.provider !== undefined) {
      this.reader.entity.setProvider(this.provider);
    }
  }

  private clearTable() {
    this.reader.reset();
  }

  private updateContract(val: string) {
    UtilsService.updateURLParameter('contract', val.trim());
    this.contract = val.trim();
    this.clearTable();

    this.form.controls['contract'].clearValidators();
    this.form.controls['provider'].clearValidators();
    this.loadContractData();
  }
}
