import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {InfoModalComponent} from './info-modal.component';

describe('InfoModalComponent', () => {
    let component: InfoModalComponent;
    let fixture: ComponentFixture<InfoModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [InfoModalComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InfoModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
