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

import {Component, Input, OnInit,} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AppComponent} from "../app.component";
import {UtilsService} from "../services/utils.service";


@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

    public form: FormGroup;

    @Input() public lastBlock: number;
    @Input() public startBlock: string;
    @Input() public endBlock: string;
    @Input() public abi: string;
    @Input() public contract: string;
    @Input() public provider: string;
    @Input() public connected: boolean;
    @Input() public refresh: boolean;

    constructor(private fb: FormBuilder,
                private appComponent: AppComponent) {
    }

    ngOnInit() {

        this.form = this.fb.group({
            provider: ['', [Validators.required], this.isProviderConnected.bind(this)],
            contract: ['', [Validators.required], this.isContractOk.bind(this)],
            abi: ['', [Validators.required], this.isABIOk.bind(this)],
            startBlock: [''],
            lastBlock: [''],
            endBlock: [''],
            refresh: ['']
        });

        this.form.get('provider').valueChanges.subscribe(val => {
            UtilsService.updateURLParameter('provider', this.provider, val);
            this.provider = val.trim();
            this.appComponent.control.entity.setProvider(this.provider);
            this.appComponent.control.reset();
            this.form.controls['provider'].clearValidators();
        });

        this.form.get('contract').valueChanges.subscribe(val => {
            if (this.provider.length > 0 && val.trim() > 0 && this.abi.length === 0) {
                UtilsService.fetchABIFromVerifiedContract(val.trim(), (value) => {
                        this.form.controls['abi'].setValue(value);
                        this.updateContract(val);
                    }
                )
            } else {
                this.updateContract(val);
            }
        });

        this.form.get('startBlock').valueChanges.subscribe(val => {
            UtilsService.updateURLParameter('start', this.startBlock, val);
            this.startBlock = val;
        });

        this.form.get('endBlock').valueChanges.subscribe(val => {
            UtilsService.updateURLParameter('end', this.endBlock, val);
            this.endBlock = val;
        });

        this.form.get('abi').valueChanges.subscribe(val => {
            if (this.provider.length > 0 && this.contract.trim().length > 0 && val.trim().length === 0) {
                UtilsService.fetchABIFromVerifiedContract(this.contract.trim(), (value) => {
                        UtilsService.updateURLWithCompressedAbi(this.abi, value);
                        this.form.controls['abi'].setValue(value);
                        this.abi = value;
                    }
                )
            } else {
                UtilsService.updateURLWithCompressedAbi(this.abi, val);
                this.abi = val;
            }
        });

        this.form.get('refresh').valueChanges.subscribe(val => {
            UtilsService.updateURLParameter('refresh', String(this.refresh),  val);
            this.refresh = Boolean(val);
            this.appComponent.control.refresh = Boolean(val);
        });

        this.form.controls['contract'].clearValidators();
        this.form.controls['abi'].clearValidators();
        this.form.controls['provider'].clearValidators();
        this.form.controls['provider'].clearValidators();
    }

    isProviderConnected() {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.connected) {
                    resolve(null);
                } else {
                    resolve({"connected": false});
                }
            }, 3000)
        })
    }

    isContractOk() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const regexPattern = /0x[0-9A-Fa-f]{40}/;
                const match = this.contract.match(regexPattern);
                if (match && this.contract === match[0]) {
                    resolve(null);
                } else {
                    resolve({"connected": false});
                }
            }, 500)
        })
    }

    isABIOk() {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    JSON.parse(this.abi);
                    resolve(null);
                } catch (e) {
                    resolve({"abi_ok": false});
                }
            }, 500)
        })
    }

    private updateContract(val) {
        UtilsService.updateURLParameter('contract', this.contract, val.trim());
        this.contract = val.trim();
        this.appComponent.control.setContractAddress(this.contract);
        this.appComponent.control.reset();
        this.form.controls['contract'].clearValidators();
    }

}
