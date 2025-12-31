import {EthEvent, EventData} from './event';

describe('EthEvent model', () => {
    it('should create an EthEvent with provided values', () => {
        const ev = new EthEvent(
            'Name',
            '123',
            '0xabc',
            '0xabc...',
            'key',
            'val',
            'time',
            'miner',
            'img'
        );

        expect(ev.name).toBe('Name');
        expect(ev.block).toBe('123');
        expect(ev.trxHash).toBe('0xabc');
        expect(ev.trxHashShort).toBe('0xabc...');
        expect(ev.key).toBe('key');
        expect(ev.value).toBe('val');
        expect(ev.time).toBe('time');
        expect(ev.miner).toBe('miner');
        expect(ev.image).toBe('img');
    });

    it('EventData map should be a Map and allow storing/removing events', () => {
        const ev = new EthEvent('N', '1', 'h', 'hs', 'k', 'v', 't', 'm', 'i');
        expect(EventData instanceof Map).toBe(true);

        EventData.set('k', ev);
        expect(EventData.get('k')).toBe(ev);

        // cleanup to avoid side-effects for other tests
        EventData.delete('k');
        expect(EventData.get('k')).toBeUndefined();
    });
});

