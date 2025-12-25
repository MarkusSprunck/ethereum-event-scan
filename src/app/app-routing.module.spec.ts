import { TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';

describe('AppRoutingModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppRoutingModule],
      providers: [importProvidersFrom(RouterModule.forRoot([]))]
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
