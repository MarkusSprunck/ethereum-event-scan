import { Reader } from './reader.service';
import { ActivatedRoute } from '@angular/router';
import { ProviderService } from './provider.service';
import { EventData } from '../models/event';
import { makeRoute } from '../../test-helpers';

describe('Reader.readEventsRange behavior', () => {
  it('splits large ranges via isBlockLimitExceeded', async () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);

    // Ensure contractInstance exists so recursive calls can call getPastEvents safely
    r['contractInstance'] = { getPastEvents: jest.fn().mockResolvedValue([]) } as any;
    r.callbackUpdateUI = jest.fn();

    // spy on the instance method to count recursive calls
    const spy = jest.spyOn(r as any, 'readEventsRange');

    // call with a very large range to trigger initial split
    (r as any).readEventsRange(0, 200001, r as any);

    // wait for microtasks so promises resolve
    await new Promise((res) => setTimeout(res, 0));

    // initial call + at least two recursive calls expected
    expect(spy).toHaveBeenCalled();
    expect((spy.mock.calls.length)).toBeGreaterThanOrEqual(3);

    spy.mockRestore();
  });

  it('handles getPastEvents rejection and decrements runningJobs', async () => {
    const entity = new ProviderService();
    const r = new Reader(makeRoute({}), entity as any);

    // prepare contractInstance with getPastEvents rejecting
    r['contractInstance'] = { getPastEvents: jest.fn().mockRejectedValue(new Error('random failure')) } as any;
    r.callbackUpdateUI = jest.fn();
    EventData.clear();

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // call with small range so no pre-split
    (r as any).readEventsRange(1, 2, r as any);
    // wait for async promise microtasks
    await new Promise((res) => setTimeout(res, 0));

    expect(r.runningJobs).toBe(0);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
