import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2
} from '@angular/core';
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appMatTableResponsive]'
})
export class EventsListResponsiveDirective
  implements OnInit, AfterViewInit, OnDestroy {
  private onDestroy$ = new Subject<boolean>();

  private thead: HTMLTableSectionElement;
  private tbody: HTMLTableSectionElement;

  private theadChanged$ = new BehaviorSubject(true);
  private tbodyChanged$ = new Subject<boolean>();

  private theadObserver = new MutationObserver(() =>
    this.theadChanged$.next(true)
  );
  private tbodyObserver = new MutationObserver(() =>
    this.tbodyChanged$.next(true)
  );

  constructor(private table: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.thead = this.table.nativeElement.querySelector('thead');
    this.tbody = this.table.nativeElement.querySelector('tbody');

    this.theadObserver.observe(this.thead, {
      characterData: true,
      subtree: true
    });
    this.tbodyObserver.observe(this.tbody, { childList: true });
  }

  ngAfterViewInit() {
    /**
     * Set the "data-column-name" attribute for every body row cell, either on
     * thead row changes (e.g. language changes) or tbody rows changes (add, delete).
     */
    combineLatest([this.theadChanged$, this.tbodyChanged$]).pipe(
      map(() => ({headRow: this.thead.rows.item(0)!, bodyRows: this.tbody.rows})),
      map(({headRow, bodyRows}) => ({
        columnNames: [...(<any>headRow.children)].map((headerCell) => (headerCell.textContent!)),
        rows: [...(<any>bodyRows)].map((row) => [...row.children])
      })),
      takeUntil(this.onDestroy$)
    )
      .subscribe(({columnNames, rows}) =>
        rows.forEach(rowCells =>
          rowCells.forEach((cell) => {
              const cellIndex = (cell as HTMLTableCellElement).cellIndex
              const columnName = columnNames[cellIndex]
              this.renderer.setAttribute(cell, 'data-column-name', columnName)
            }
          )
        )
      );
  }

  ngOnDestroy(): void {
    this.theadObserver.disconnect();
    this.tbodyObserver.disconnect();

    this.onDestroy$.next(true);
  }
}
