import { EventsListResponsiveDirective } from './events-list-responsive.directive';

describe('EventsListResponsiveDirective', () => {
  it('should set data-column-name attributes on body cells based on thead headers', () => {
    // Create a simple table with thead and tbody
    const table = document.createElement('table');

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const th1 = document.createElement('th');
    th1.textContent = 'ColA';
    const th2 = document.createElement('th');
    th2.textContent = 'ColB';
    headRow.appendChild(th1);
    headRow.appendChild(th2);
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const bodyRow = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = 'val1';
    const td2 = document.createElement('td');
    td2.textContent = 'val2';
    bodyRow.appendChild(td1);
    bodyRow.appendChild(td2);
    tbody.appendChild(bodyRow);
    table.appendChild(tbody);

    // Renderer2 stub that records calls
    const setAttributeMock = jest.fn();
    const rendererStub: any = { setAttribute: setAttributeMock };

    // Create directive instance with ElementRef-like object
    const directive: any = new EventsListResponsiveDirective({ nativeElement: table } as any, rendererStub);

    // Initialize directive (ngOnInit will look for thead/tbody and setup observers)
    directive.ngOnInit();

    // Call ngAfterViewInit to set up subscription
    directive.ngAfterViewInit();

    // Simulate a tbody change to trigger combineLatest emission
    // theadChanged$ is a BehaviorSubject(true) so emitting tbodyChanged$ is sufficient
    (directive as any).tbodyChanged$.next(true);

    // Expect setAttribute to have been called for each cell in the single row
    expect(setAttributeMock).toHaveBeenCalledTimes(2);

    // Check the first call arguments: cell, attribute name, and header value
    const firstCallArgs = setAttributeMock.mock.calls[0];
    expect(firstCallArgs[1]).toBe('data-column-name');
    expect(firstCallArgs[2]).toBe('ColA');

    const secondCallArgs = setAttributeMock.mock.calls[1];
    expect(secondCallArgs[1]).toBe('data-column-name');
    expect(secondCallArgs[2]).toBe('ColB');

    // cleanup
    directive.ngOnDestroy();
  });
});

