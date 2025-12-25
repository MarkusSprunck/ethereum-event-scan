// noinspection JSUnusedGlobalSymbols

import { Reader } from './reader.service';
import { EventData } from '../models/event';
import { makeRoute } from '../../test-helpers';

describe('Reader additional unit tests', () => {
  let entity: any;
  let r: Reader;

  beforeEach(() => {
    entity = {
      web3: null,
      currentBlock: 0,
      setProvider: jest.fn(),
      isConnectionWorking: () => false,
      isSyncing: () => false
    };
    r = new Reader(makeRoute({}), entity as any);
  });

  afterEach(() => {
    EventData.clear();
    jest.useRealTimers();
  });

  it('setUpdateCallback stores the callback', () => {
    const cb = jest.fn();
    r.setUpdateCallback(cb);
    // internal storage should point to our callback
    expect((r as any).callbackUpdateUI).toBe(cb);
  });

  it('reset clears EventData and resets contractInstance and startBlock', () => {
    EventData.set('x', { name: 'n' } as any);
    (r as any).contractInstance = { foo: 'bar' };
    r.startInitial = '10';
    r.startBlock = '20';
    r.reset();
    expect(EventData.size).toBe(0);
    expect((r as any).contractInstance).toBeNull();
    expect(r.startBlock).toBe('10');
  });

  it('setAbi sets abi and calls createActiveContract', () => {
    const spy = jest.spyOn(r as any, 'createActiveContract');
    r.setAbi('[{"type":"event"}]');
    expect((r as any).abi).toContain('event');
    expect(spy).toHaveBeenCalled();
  });

  it('setContractAddress creates contractInstance when web3 available', () => {
    entity.web3 = { eth: { Contract: function (json: any, addr: any) {
                (this as any).json = json; (this as any).addr = addr; } } } as any;
    r.abi = '[{"type":"event"}]';
    r.setContractAddress('0xabc');
    expect((r as any).contractInstance).not.toBeNull();
  });

  it('setContractAddress leaves contractInstance null on invalid data', () => {
    entity.web3 = null;
    r.abi = '[{"type":"event"}]';
    r.setContractAddress('0xabc');
    expect((r as any).contractInstance).toBeNull();
  });

  it('getCurrentBlockNumber updates entity.currentBlock when web3 returns value', async () => {
    entity.isConnectionWorking = () => true;
    entity.isSyncing = () => false;
    entity.web3 = { eth: { getBlockNumber: () => Promise.resolve(77) } };
    entity.currentBlock = 0;

    const ret = r.getCurrentBlockNumber();
    // initial return is Number(entity.currentBlock) (before promise resolves)
    expect(typeof ret).toBe('number');
    // wait for promise microtasks
    await new Promise((res) => setTimeout(res, 0));
    expect(entity.currentBlock).toBe(77);
  });

  it('fetchCurrentBlockNumber calls getCurrentBlockNumber when connected', () => {
    entity.isConnectionWorking = () => true;
    // ensure web3 is available to avoid runtime access errors if the method
    // isn't spied correctly; provide a minimal getBlockNumber implementation
    entity.web3 = { eth: { getBlockNumber: () => Promise.resolve(1) } };
    const spy = jest.spyOn(r as any, 'getCurrentBlockNumber');
    r.fetchCurrentBlockNumber();
    expect(spy).toHaveBeenCalled();
  });

  it('fetchEvents calls getPastEvents only when not skipped and connected', () => {
    entity.isConnectionWorking = () => true;
    const spy = jest.spyOn(r as any, 'getPastEvents');
    r.skipUpdate = false;
    r.fetchEvents();
    expect(spy).toHaveBeenCalled();

    spy.mockClear();
    r.skipUpdate = true;
    r.fetchEvents();
    expect(spy).not.toHaveBeenCalled();
  });

  it('runLoadTable schedules fetchCurrentBlockNumber and fetchEvents', () => {
    jest.useFakeTimers();
    const spyA = jest.spyOn(r as any, 'fetchCurrentBlockNumber');
    const spyB = jest.spyOn(r as any, 'fetchEvents');
    r.runLoadTable();
    // initial timeouts at 100ms and 200ms
    jest.advanceTimersByTime(150);
    expect(spyA).toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(spyB).toHaveBeenCalled();
    // intervals: advance by 1000ms to trigger periodic fetchCurrentBlockNumber
    jest.advanceTimersByTime(1000);
    expect(spyA).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

});
