import {
    AfterViewInit,
    Directive,
    ElementRef,
    OnDestroy,
    OnInit,
    Renderer2
} from "@angular/core";
import {BehaviorSubject, combineLatest, Subject} from "rxjs";
import {map, mapTo, takeUntil} from "rxjs/operators";

@Directive({
    selector: "[matTableResponsive]"
})
export class MatTableResponsiveDirective implements OnInit, AfterViewInit, OnDestroy {

    private onDestroy$ = new Subject<boolean>();

    private thead: HTMLTableSectionElement;
    private tbody: HTMLTableSectionElement;

    private theadChanged$ = new BehaviorSubject(true);
    private tbodyChanged$ = new Subject<boolean>();

    private theadObserver = new MutationObserver(() => this.theadChanged$.next(true));
    private tbodyObserver = new MutationObserver(() => this.tbodyChanged$.next(true));

    constructor(private table: ElementRef, private renderer: Renderer2) {
    }

    ngOnInit() {
        this.thead = this.table.nativeElement.querySelector("thead");
        this.tbody = this.table.nativeElement.querySelector("tbody");

        this.theadObserver.observe(this.thead, {characterData: true, subtree: true});
        this.tbodyObserver.observe(this.tbody, {childList: true});
    }

    ngAfterViewInit() {

        combineLatest([this.theadChanged$, this.tbodyChanged$])
            .pipe(
                mapTo([this.thead.rows.item(0), this.tbody.rows]),
                map(
                    ([headRow, bodyRows]: [HTMLTableRowElement, HTMLCollectionOf<HTMLTableRowElement>]) => {
                        return [
                            // @ts-ignore
                            [...headRow.children].map(headerCell => headerCell.textContent),
                            // @ts-ignore
                            [...bodyRows].map(row => [...row.children])
                        ];
                    }
                ),
                takeUntil(this.onDestroy$)
            )
            .subscribe(([columnNames, rows]: [string[], HTMLTableCellElement[][]]) =>
                rows.forEach(rowCells =>
                    rowCells.forEach(cell => this.renderer.setAttribute(
                        cell,
                        "data-column-name",
                        columnNames[cell.cellIndex]
                        )
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
