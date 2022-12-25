import {AfterViewInit, Directive, ElementRef, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {BehaviorSubject, combineLatest, Subject} from 'rxjs';
import {map, mapTo, takeUntil} from 'rxjs/operators';

@Directive({
  selector: '[appMatTableResponsive]'
})
export class EventsListResponsiveDirective implements OnInit, AfterViewInit, OnDestroy {

  private onDestroy$ = new Subject<boolean>();

  private readonly thead: HTMLTableSectionElement;

  private readonly tbody: HTMLTableSectionElement;

  private theadChanged$ = new BehaviorSubject(true);
  private tbodyChanged$ = new Subject<boolean>();

  private theadObserver = new MutationObserver(() => this.theadChanged$.next(true));
  private tbodyObserver = new MutationObserver(() => this.tbodyChanged$.next(true));

  constructor(private table: ElementRef, private renderer: Renderer2) {
    this.thead = this.table.nativeElement.querySelector('thead');
    this.tbody = this.table.nativeElement.querySelector('tbody');
  }

  ngOnInit() {
    this.theadObserver.observe(this.thead, {characterData: true, subtree: true});
    this.tbodyObserver.observe(this.tbody, {childList: true});
  }

  ngAfterViewInit() {


    // @ts-ignore
    combineLatest([this.theadChanged$, this.tbodyChanged$]).pipe(mapTo([this.thead.rows.item(0), this.tbody.rows]),
      map(
        ([headRow, bodyRows]: [HTMLTableRowElement, HTMLCollectionOf<HTMLTableRowElement>]) => {
          // @ts-ignore
          return [[...headRow.children].map(headerCell => headerCell.textContent), [...bodyRows].map(row => [...row.children])];
        }
      ),
      takeUntil(this.onDestroy$)
    )
  }

  ngOnDestroy(): void {
    this.theadObserver.disconnect();
    this.tbodyObserver.disconnect();
    this.onDestroy$.next(true);
  }
}
