import {Directive, ElementRef, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';

@Directive({
  selector: '[appMatTableResponsive]'
})
export class EventsListResponsiveDirective implements OnInit, OnDestroy {

  private onDestroy$ = new Subject<boolean>();

  private thead: HTMLTableSectionElement | undefined;

  private tbody: HTMLTableSectionElement | undefined;

  private theadChanged$ = new BehaviorSubject(true);

  private tbodyChanged$ = new Subject<boolean>();

  private theadObserver = new MutationObserver(() => this.theadChanged$.next(true));

  private tbodyObserver = new MutationObserver(() => this.tbodyChanged$.next(true));

  constructor(private table: ElementRef, private renderer: Renderer2) {
  }

  ngOnInit() {
    this.thead = this.table.nativeElement.querySelector('thead');
    this.tbody = this.table.nativeElement.querySelector('tbody');
    if (this.thead !== undefined) {
      this.theadObserver.observe(this.thead, {characterData: true, subtree: true});
    }
    if (this.tbody !== undefined) {
      this.tbodyObserver.observe(this.tbody, {childList: true});
    }
  }

  ngOnDestroy(): void {
    this.theadObserver.disconnect();
    this.tbodyObserver.disconnect();
    this.onDestroy$.next(true);
  }
}
