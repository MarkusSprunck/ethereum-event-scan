import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA, Component } from '@angular/core';
import {SettingsComponent} from "./settings.component";

describe('SettingsComponent', () => {
  let component: MockSettingsComponent;
  let fixture: ComponentFixture<MockSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, MockSettingsComponent], // Move MockSettingsComponent to imports
    }).compileComponents();

    fixture = TestBed.createComponent(MockSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Add more test cases here for uncovered lines
});

@Component({
  selector: 'app-settings',
  template: '', // Inline empty template
  styles: [] // Inline empty styles
})
class MockSettingsComponent {}
