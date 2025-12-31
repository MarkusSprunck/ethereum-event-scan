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

  it('should create MutationObserver for thead with callback that triggers theadChanged$ (line 50)', () => {
    const table = document.createElement('table');

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const th1 = document.createElement('th');
    th1.textContent = 'ColA';
    headRow.appendChild(th1);
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const rendererStub: any = { setAttribute: jest.fn() };
    const directive: any = new EventsListResponsiveDirective({ nativeElement: table } as any, rendererStub);

    // Spy on the theadObserver.observe method to verify it's called
    const observeSpy = jest.spyOn(directive.theadObserver, 'observe');

    directive.ngOnInit();

    // Verify theadObserver.observe was called with correct parameters
    expect(observeSpy).toHaveBeenCalledWith(thead, {
      characterData: true,
      subtree: true
    });

    // The theadObserver is created with a callback on line 50
    // Verify that theadObserver exists and has been set up
    expect(directive.theadObserver).toBeDefined();

    directive.ngOnDestroy();
  });

  it('should create MutationObserver for tbody with callback that triggers tbodyChanged$ (line 53)', () => {
    const table = document.createElement('table');

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const th1 = document.createElement('th');
    th1.textContent = 'ColA';
    headRow.appendChild(th1);
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const rendererStub: any = { setAttribute: jest.fn() };
    const directive: any = new EventsListResponsiveDirective({ nativeElement: table } as any, rendererStub);

    // Spy on the tbodyObserver.observe method to verify it's called
    const observeSpy = jest.spyOn(directive.tbodyObserver, 'observe');

    directive.ngOnInit();

    // Verify tbodyObserver.observe was called with correct parameters
    expect(observeSpy).toHaveBeenCalledWith(tbody, { childList: true });

    // The tbodyObserver is created with a callback on line 53
    // Verify that tbodyObserver exists and has been set up
    expect(directive.tbodyObserver).toBeDefined();

    directive.ngOnDestroy();
  });

  it('should execute MutationObserver callbacks when observers are triggered (lines 50, 53)', () => {
    // Mock MutationObserver to capture callbacks
    let theadCallback: MutationCallback | null = null;
    let tbodyCallback: MutationCallback | null = null;

    const OriginalMutationObserver = global.MutationObserver;
    let callCount = 0;

    global.MutationObserver = class MockMutationObserver {
      constructor(callback: MutationCallback) {
        if (callCount === 0) {
          theadCallback = callback; // First observer is thead (line 50)
        } else if (callCount === 1) {
          tbodyCallback = callback; // Second observer is tbody (line 53)
        }
        callCount++;
      }
      observe() {}
      disconnect() {}
      takeRecords() { return []; }
    } as any;

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const th1 = document.createElement('th');
    th1.textContent = 'ColA';
    headRow.appendChild(th1);
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const rendererStub: any = { setAttribute: jest.fn() };

    // Create directive - this will create the observers with callbacks
    const directive: any = new EventsListResponsiveDirective({ nativeElement: table } as any, rendererStub);

    // Verify callbacks were captured
    expect(theadCallback).toBeDefined();
    expect(tbodyCallback).toBeDefined();

    // Spy on the subjects to verify callbacks work
    const theadSpy = jest.fn();
    const tbodySpy = jest.fn();
    directive.theadChanged$.subscribe(theadSpy);
    directive.tbodyChanged$.subscribe(tbodySpy);

    const initialTheadCount = theadSpy.mock.calls.length;

    // Execute the thead callback (line 50) manually
    if (theadCallback) {
      // @ts-ignore
        theadCallback([], {} as any);
    }

    // Verify thead callback executed and triggered theadChanged$
    expect(theadSpy.mock.calls.length).toBeGreaterThan(initialTheadCount);

    // Execute the tbody callback (line 53) manually
    if (tbodyCallback) {
      // @ts-ignore
        tbodyCallback([], {} as any);
    }

    // Verify tbody callback executed and triggered tbodyChanged$
    expect(tbodySpy).toHaveBeenCalled();

    // Restore original MutationObserver
    global.MutationObserver = OriginalMutationObserver;
  });
});
