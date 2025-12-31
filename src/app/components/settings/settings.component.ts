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

import {
    Component,
    Input,
    OnInit,
    OnChanges,
    SimpleChanges,
    AfterViewInit,
    ChangeDetectorRef,
    OnDestroy
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    FormsModule,
    ReactiveFormsModule,
    AbstractControl
} from '@angular/forms';
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
import {JsonFormatterDirective} from './directives/json-formatter.directive';
import {Router, ActivatedRoute} from '@angular/router';
import {Subscription, debounceTime, distinctUntilChanged} from 'rxjs';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

interface AbiEntry {
    anonymous?: boolean;
    inputs: any[];
    name: string;
    type: string;
}

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule, TextFieldModule, JsonFormatterDirective],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnChanges {

    public form: FormGroup;
    private _lastSeenReaderAbi = '';
    private _subscriptions: Subscription[] = [];
    public highlightedAbi: SafeHtml = '';

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
                private cdr: ChangeDetectorRef,
                private router: Router,
                private route: ActivatedRoute,
                private sanitizer: DomSanitizer) {
        this.form = this.fb.group({
            provider: [this.provider || '', [Validators.required], this.isProviderConnected.bind(this)],
            contract: [this.contract || '', [Validators.required], this.isContractOk.bind(this)],
            abi: [this.abi || '', [Validators.required], this.isABIOk.bind(this)],
            startBlock: [this.startBlock || '0', [Validators.required], this.isStartBlockOk.bind(this)],
            lastBlock: [this.lastBlock || ''],
            endBlock: [this.endBlock || 'latest', [Validators.required], this.isEndBlockOk.bind(this)]
        });
    }

    panelMessage() {
        return `Last Block ${this.lastBlock}`;
    }

    isProviderConnected(control: AbstractControl) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.connected) {
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

    updateStartValue(value?: string) {
        // Prefer explicit value (from input event). Fallback to form control value.
        const result: string = (typeof value === 'string') ? ((value.length === 0) ? '0' : value) : ((this.form.get('startBlock')?.value || '0'));
        if (this.router && this.route) {
            void this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {start: result},
                queryParamsHandling: 'merge'
            });
        } else {
            UtilsService.updateURLParameter('start', result);
        }
        this.startBlock = result;
    }

    updateProviderValue() {
        const val = this.form.get('provider');
        const v = (val && val.value) ? val.value : this.provider;
        if (this.router && this.route) {
            void this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {provider: v},
                queryParamsHandling: 'merge'
            });
        } else {
            UtilsService.updateURLParameter('provider', v);
        }
        this.provider = (typeof v === 'string') ? v.trim() : v;

        this.form.controls['provider'].clearValidators();
        this.loadContractData();
    }

    updateEndValue() {
        const val = this.form.get('endBlock');
        const v = (val && val.value) ? val.value : this.endBlock;
        if (this.router && this.route) {
            void this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {end: v},
                queryParamsHandling: 'merge'
            });
        } else {
            UtilsService.updateURLParameter('end', v);
        }
        this.endBlock = v;
        this.loadContractData();
    }

    updateContractValue() {
        const val = this.form.get('contract');
        const candidate = (val && val.value) ? val.value : this.contract;
        if (candidate) {
            if (this.provider.length > 0 && candidate.trim().length > 0 && this.abi.length === 0) {
                UtilsService.fetchABIFromVerifiedContract(candidate.trim(), (value: string) => {
                        if (this.router && this.route) {
                            const urlSafe = UtilsService.compressAbiToUrlSafe(value);
                            void this.router.navigate([], {
                                relativeTo: this.route,
                                queryParams: {abi: urlSafe},
                                queryParamsHandling: 'merge'
                            });
                        } else {
                            UtilsService.updateURLWithCompressedAbi(value);
                        }
                        this.form.controls['abi'].setValue(value);
                        this.updateContract(candidate);
                    }
                );
            } else {
                this.updateContract(candidate);
            }
        }
    }

    updateABIValue(value?: string) {
        const controlValue = (typeof value === 'string') ? value : (this.form.get('abi') ? this.form.get('abi')!.value : '');
        if (controlValue !== undefined) {
            if (this.provider.length > 0 && this.contract.trim().length > 0 && controlValue.trim().length === 0) {

                UtilsService.fetchABIFromVerifiedContract(this.contract.trim(), (val: string) => {
                        // compress ABI and set as query param; use router if available, otherwise UtilsService helper
                        const urlSafe = UtilsService.compressAbiToUrlSafe(val);
                        if (this.router && this.route) {
                            void this.router.navigate([], {
                                relativeTo: this.route,
                                queryParams: {abi: urlSafe},
                                queryParamsHandling: 'merge'
                            });
                        } else {
                            UtilsService.updateURLWithCompressedAbi(val);
                        }
                        this.form.controls['abi'].setValue(val);
                        this.abi = val;
                        // clear errors since we just set a valid abi
                        this.form.controls['abi'].setErrors(null);
                    }
                );
            } else {
                try {
                    const objAbi: AbiEntry[] = JSON.parse(controlValue);
                    const filteredData: AbiEntry[] = (objAbi.filter((abiEntry) => abiEntry.type === 'event'));
                    filteredData.forEach(function (v) {
                        delete v['anonymous'];
                    });
                    this.abi = stringify(filteredData);

                    // compress ABI and set as query param
                    const urlSafe = UtilsService.compressAbiToUrlSafe(this.abi);
                    if (this.router && this.route) {
                        void this.router.navigate([], {
                            relativeTo: this.route,
                            queryParams: {abi: urlSafe},
                            queryParamsHandling: 'merge'
                        });
                    } else {
                        UtilsService.updateURLWithCompressedAbi(this.abi);
                    }
                    this.loadContractData();
                    // clear errors on successful parse
                    this.form.controls['abi'].setErrors(null);
                } catch (e) {
                    // invalid JSON — mark control as invalid manually
                    this.form.controls['abi'].setErrors({json: true});
                }
            }
        }
    }

    onBlurAbi() {
        this.noOfRowsAbi = 1;
        // Delay to allow JsonFormatterDirective to complete formatting
        setTimeout(() => {
            this.updateHighlightedAbi();
        }, 10);
    }

    onFocusAbi() {
        this.noOfRowsAbi = 15;
        // Delay to allow JsonFormatterDirective to complete formatting
        setTimeout(() => {
            this.updateHighlightedAbi();
        }, 10);
    }

    onScrollAbi(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        const highlightDiv = textarea.parentElement?.querySelector('.json-highlight') as HTMLElement;
        if (highlightDiv) {
            highlightDiv.scrollTop = textarea.scrollTop;
            highlightDiv.scrollLeft = textarea.scrollLeft;
        }
    }

    private updateHighlightedAbi() {
        const abiValue = this.form.get('abi')?.value || '';
        this.highlightedAbi = this.sanitizer.bypassSecurityTrustHtml(this.highlightJson(abiValue));
    }

    private highlightJson(json: string): string {
        if (!json || json.trim().length === 0) {
            return '';
        }

        // Use the text as-is from the textarea (already formatted by JsonFormatterDirective)
        // Just colorize it without re-formatting to ensure alignment
        return this.colorizeJson(json);
    }

    private colorizeJson(text: string): string {
        // Escape HTML special characters first
        text = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Colorize JSON syntax
        return text.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';

            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }

            return '<span class="' + cls + '">' + match + '</span>';
        }).replace(/([{}[\],:])/g, '<span class="json-punctuation">$1</span>');
    }

    reloadPage() {
        // Centralized reload helper (keeps tests safe)
        UtilsService.reloadAfterUpdate();
    }

    ngOnInit(): void {
        // Initialize form controls from @Input properties so the template shows current values
        if (this.form) {
            this.form.patchValue({
                provider: this.provider || '',
                contract: this.contract || '',
                abi: this.compactAbi(this.abi || ''),
                startBlock: this.startBlock || '0',
                endBlock: this.endBlock || 'latest'
            });

            // Keep component.abi and native textarea in sync with the form control
            const abiControl = this.form.controls['abi'];
            if (abiControl && abiControl.valueChanges && typeof abiControl.valueChanges.subscribe === 'function') {
                const subAbi = abiControl.valueChanges.subscribe((v: any) => {
                    this.abi = v || '';
                    this.updateHighlightedAbi();
                });
                this._subscriptions.push(subAbi);
            }

            // Subscribe to startBlock changes and update URL (debounced)
            const startControl = this.form.controls['startBlock'];
            if (startControl && startControl.valueChanges && typeof startControl.valueChanges.pipe === 'function') {
                const sub = startControl.valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe((v: any) => {
                    const value = (typeof v === 'string' && v.length === 0) ? '0' : v;
                    this.updateStartValue(value);
                });
                this._subscriptions.push(sub);
            }

            // Subscribe to endBlock changes and update URL (debounced)
            const endControl = this.form.controls['endBlock'];
            if (endControl && endControl.valueChanges && typeof endControl.valueChanges.pipe === 'function') {
                const subEnd = endControl.valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe(() => {
                    this.updateEndValue();
                });
                this._subscriptions.push(subEnd);
            }

            // Subscribe to provider changes and update URL (debounced)
            const providerControl = this.form.controls['provider'];
            if (providerControl && providerControl.valueChanges && typeof providerControl.valueChanges.pipe === 'function') {
                const sub2 = providerControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((_v: any) => {
                    this.updateProviderValue();
                });
                this._subscriptions.push(sub2);
            }

            // Subscribe to contract changes and update URL (debounced)
            const contractControl = this.form.controls['contract'];
            if (contractControl && contractControl.valueChanges && typeof contractControl.valueChanges.pipe === 'function') {
                const subC = contractControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((_v: any) => {
                    this.updateContractValue();
                });
                this._subscriptions.push(subC);
            }

            // Subscribe to ABI changes and update compressed ABI in URL (debounced)
            const abiControl2 = this.form.controls['abi'];
            if (abiControl2 && abiControl2.valueChanges && typeof abiControl2.valueChanges.pipe === 'function') {
                const subAbiUrl = abiControl2.valueChanges.pipe(debounceTime(600), distinctUntilChanged()).subscribe((v: any) => {
                    // call the update handler which compresses and updates URL
                    this.updateABIValue(v);
                });
                this._subscriptions.push(subAbiUrl);
            }
        }

        // Initialize highlighted ABI
        this.updateHighlightedAbi();
    }

    private compactAbi(abi: string): string {
        try {
            const parsedAbi = JSON.parse(abi);
            return stringify(parsedAbi);
        } catch (e) {
            return abi; // Return original ABI if parsing fails
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
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
            this.form.patchValue(patch);
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
        // update query param using router (no reload) if available, otherwise use UtilsService
        if (this.router && this.route) {
            void this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {contract: val.trim()},
                queryParamsHandling: 'merge'
            });
        } else {
            UtilsService.updateURLParameter('contract', val.trim());
        }
        this.contract = val.trim();
        this.clearTable();

        this.form.controls['contract'].clearValidators();
        this.form.controls['provider'].clearValidators();
        this.loadContractData();
    }
}
