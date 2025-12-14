import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutingModule } from './app-routing.module';

describe('AppRoutingModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppRoutingModule, RouterTestingModule]
    });
  });

  it('should be created', () => {
    const module = TestBed.inject(AppRoutingModule);
    expect(module).toBeTruthy();
  });

  it('should have no configured routes', () => {
    const router = TestBed.inject(Router);
    expect(router.config).toEqual([]);
  });
});

