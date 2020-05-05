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

import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AppComponent} from '../app.component';
import {UtilsService} from '../services/utils.service';

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

    panelOpenState = true;

    noOfRowsAbi = 1;

    constructor(private fb: FormBuilder,
                public appComponent: AppComponent) {
    }

    panelMessage() {
        if (!this.refresh) {
            return 'Automatic refresh stopped';
        } else if (this.lastBlock === 0) {
            return 'Automatic refresh running';
        } else {
            return ('Last Block ' + this.lastBlock + '');
        }
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

        this.form.controls.contract.clearValidators();
        this.form.controls.abi.clearValidators();
        this.form.controls.provider.clearValidators();
    }

    isProviderConnected() {
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

    isContractOk() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const regexPattern = /0x[0-9A-Fa-f]{40}/;
                const match = this.contract.match(regexPattern);
                if (match && this.contract === match[0]) {
                    resolve(null);
                } else {
                    resolve({connected: false});
                }
            }, 500);
        });
    }

    isABIOk() {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    JSON.parse(this.abi);
                    resolve(null);
                } catch (e) {
                    resolve({abi_ok: false});
                }
            }, 500);
        });
    }

    updateStartValue() {
        let val = this.form.get('startBlock');
        if (val) {
            const result: string = (val.value.length === 0) ? '0' : val.value;
            console.debug('updateStartValue: ', this.startBlock, ' -> ', result);
            UtilsService.updateURLParameter('start', this.startBlock, result);
            this.startBlock = result
        }
    }

    updateProviderValue() {
        const val = this.form.get('provider');
        if (val) {
            console.debug('updateProviderValue: ', this.provider, ' -> ', val);
            UtilsService.updateURLParameter('provider', this.provider, val.value);
            this.provider = val.value.trim();
            this.form.controls.provider.clearValidators();
            this.loadContractData();
        }
    }


    updateEndValue() {
        const val = this.form.get('endBlock');
        if (val) {
            console.debug('updateEndValue: ', this.endBlock, ' -> ', val);
            UtilsService.updateURLParameter('end', this.endBlock, val.value);
            this.endBlock = val.value;
            this.loadContractData();
        }
    }

    updateContractValue() {
        const val = this.form.get('contract');
        if (val) {
            console.debug('updateContractValue: ', this.contract, ' -> ', val);
            if (this.provider.length > 0 && val.value.trim() > 0 && this.abi.length === 0) {
                UtilsService.fetchABIFromVerifiedContract(val.value.trim(), (value: any) => {
                        this.form.controls.abi.setValue(value);
                        this.updateContract(val.value);
                    }
                );
            } else {
                this.updateContract(val.value);
            }
        }
    }

    updateABIValue() {
        const val = this.form.get('abi');
        if (val) {
            console.debug('updateABIValue: ', this.abi, ' -> ', val);
            if (this.provider.length > 0 && this.contract.trim().length > 0 && val.value.trim().length === 0) {
                UtilsService.fetchABIFromVerifiedContract(this.contract.trim(), (value: any) => {
                        UtilsService.updateURLWithCompressedAbi(this.abi, value);
                        this.form.controls.abi.setValue(value);
                        this.abi = value;
                    }
                );
            } else {
                UtilsService.updateURLWithCompressedAbi(this.abi, val.value);
                this.abi = val.value;
                this.loadContractData();
            }
        }
    }

    updateRefreshValue() {
        const val = !this.refresh;
        console.debug('updateRefreshValue: ', this.refresh, ' -> ', val);
        UtilsService.updateURLParameter('refresh', String(this.refresh), String(val));
        this.appComponent.control.skipUpdate = !val;
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

    private loadContractData() {
        this.appComponent.control.setAbi(this.abi);
        this.appComponent.control.setStartBlock(this.startBlock);
        this.appComponent.control.setEndBlock(this.endBlock);
        this.appComponent.control.setContractAddress(this.contract);
        this.appComponent.control.entity.setProvider(this.provider);
    }

    private clearTable() {
        this.appComponent.control.reset();
    }

    private updateContract(val: string) {
        UtilsService.updateURLParameter('contract', this.contract, val.trim());
        this.contract = val.trim();
        this.clearTable();
        this.form.controls.contract.clearValidators();
        this.form.controls.provider.clearValidators();
        this.loadContractData();
    }
}
