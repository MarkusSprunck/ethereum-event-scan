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

import {CommonModule, DecimalPipe} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {MainComponent} from './pages/main/main.component';
import {AppRoutingModule} from './app-routing.module';
import {SettingsComponent} from 'src/app/components/settings/settings.component';
import {Reader} from './services/reader.service';
import {ModalDialogComponent} from './components/modal-dialog/modal-dialog.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {JsonFormatterDirective} from './components/settings/directives/json-formatter.directive';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatRadioModule} from '@angular/material/radio';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatButtonModule} from '@angular/material/button';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatSelectModule} from '@angular/material/select';
import {MatNativeDateModule, MatOptionModule} from '@angular/material/core';
import {MatExpansionModule} from '@angular/material/expansion';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {EventsTableComponent} from './components/events-table/events-table.component';
import {HighlightSearch} from './components/events-table/pipes/highlight-search.pipe';
import {ModalDialogContentComponent} from './components/modal-dialog/modal-dialog-content.component';
import {MatListModule} from '@angular/material/list';
import {FlexModule} from '@angular/flex-layout';
import {EventsListResponsiveDirective} from './components/events-table/directives/events-list-responsive.directive'
import {ThemeService} from "./services/theme.service";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatButtonToggleModule} from "@angular/material/button-toggle";
import {MatSliderModule} from "@angular/material/slider";

@NgModule({
    declarations: [
        MainComponent,
        SettingsComponent,
        ModalDialogComponent,
        JsonFormatterDirective,
        EventsTableComponent,
        EventsTableComponent,
        HighlightSearch,
        ModalDialogComponent,
        ModalDialogContentComponent,
        EventsListResponsiveDirective
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        MatFormFieldModule,
        MatIconModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatGridListModule,
        MatFormFieldModule,
        MatInputModule,
        MatRadioModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatSnackBarModule,
        MatTableModule,
        MatIconModule,
        MatPaginatorModule,
        MatSortModule,
        MatCheckboxModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatOptionModule,
        MatDialogModule,
        MatListModule,
        FlexModule,
        MatSlideToggleModule,
        MatSliderModule
    ],
    exports: [EventsListResponsiveDirective],
    providers: [Reader, DecimalPipe,
        ThemeService, ModalDialogContentComponent,
        {
            provide: MatDialogRef,
            useValue: {}
        },
        {
            provide: MAT_DIALOG_DATA, useValue: {}
        },
        ModalDialogComponent],
    bootstrap: [MainComponent],
    entryComponents: [ModalDialogComponent]
})
export class AppModule {
}
