// noinspection JSUnusedGlobalSymbols

import {Reader} from './reader.service';
import {
    makeRoute,
    mockAtobWithGzipHeader,
    normalizeUrlSafeBase64ToBuffer,
    restoreAtob
} from '../../test-helpers';

describe('Reader URL ABI decoding (integration-style)', () => {
    const encodedAbiParam = `eJzdmMtu2zAQRf%2BFa6%2BaogvvAmeRLgoUdR6LwChocWITkUmDQyoRAv97SdkS9XDlJHraS4mD4bnUkHOpp3fCxdZoJNOnxYRsaUyXIZDpMw0RJgQ11fDLaLrkIdcxmRIhRRo0ITre2lgSSIFamUBLRXaTd0JtULyRBrM82RxuOgZvwHJDGpSg4d0%2BF2VMAaJNLujGvfgbKKAuczZdGuKmOpHNYnGx8skiUMil8LkOAbtFFjLzYm6kyKmECIRuXx9HNPA1dctYA159y63VmuLap0rHc%2BpubcDMLajNennK%2FsBGRheqLKIhZxf73SL50oMyGgTS2MRVaZ7nNzXYBMWeHW2SqGvGxoTT0RYrH9RGhdVD%2BvPnPfKVoNooqCbzwuZp0GxNxWokZXhv2%2BxYCvFxzTWEHPU123AxmoIsYjUuzA7AgI1vsYDVrFTi5Kh9OArVnMK%2B2h8jNkoa3dR4PhsRaOfnemIvVtyZa0gqYEABFa9w0iokNwG43Yd1R55uuvbAV6Ad9dxSGSywn%2F6s9W6sCCZlmLvrOMOYw3KDuw%2BtVcTh9bOrVBD7UySTzw71WCPX2Ocf3z20n%2FYw0hPxPGcUanDL%2FuKoregB9z6xR2cA%2BjD%2BOmjnZOV4pLGd2KG9bc62JNb0v4uVWmqTg%2Bks91MPm1wU%2BuyIpalHukAt9G2VOOXODUc3Xm8PP5Tdy3MIyxrAAMa%2FCjGgg6%2BBOT8rrrL%2FkcPvji%2FRy5cRkH%2F8r1fzv1z4P5PbX90b0UmrWvwDsBVCJg%3D%3D`;

    // expected ABI from user (trimmed whitespace) -> parse to object for deep equality
    const expectedAbi = [
        {
            "inputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": false,
                "internalType": "address",
                "name": "_creator",
                "type": "address"
            }, {
                "indexed": false,
                "internalType": "string",
                "name": "version",
                "type": "string"
            }],
            "name": "ConstructorDone",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": false,
                "internalType": "address",
                "name": "issuer",
                "type": "address"
            }, {
                "indexed": false,
                "internalType": "bytes32",
                "name": "_hash",
                "type": "bytes32"
            }],
            "name": "HashCreated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": false,
                "internalType": "address",
                "name": "issuer",
                "type": "address"
            }, {
                "indexed": false,
                "internalType": "bytes32",
                "name": "_hash",
                "type": "bytes32"
            }],
            "name": "HashRemoved",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": false,
                "internalType": "address",
                "name": "issuer",
                "type": "address"
            }, {
                "indexed": false,
                "internalType": "bytes32",
                "name": "_hash",
                "type": "bytes32"
            }],
            "name": "HashRevalidated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": false,
                "internalType": "address",
                "name": "issuer",
                "type": "address"
            }, {
                "indexed": false,
                "internalType": "bytes32",
                "name": "_hash",
                "type": "bytes32"
            }],
            "name": "HashRevoked",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }],
            "name": "Paused",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }],
            "name": "PauserAdded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }],
            "name": "PauserRemoved",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": false,
                "internalType": "string",
                "name": "url",
                "type": "string"
            }, {
                "indexed": false,
                "internalType": "string",
                "name": "signature",
                "type": "string"
            }],
            "name": "SignatureChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }],
            "name": "Unpaused",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }],
            "name": "WhitelistAdminAdded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }],
            "name": "WhitelistAdminRemoved",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }],
            "name": "WhitelistedAdded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [{
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }],
            "name": "WhitelistedRemoved",
            "type": "event"
        },
        {
            "constant": false,
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "addPauser",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "addWhitelistAdmin",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "addWhitelisted",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
            "name": "createHash",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
            "name": "getHashStatus",
            "outputs": [{
                "internalType": "address",
                "name": "issuer",
                "type": "address"
            }, {"internalType": "bool", "name": "valid", "type": "bool"}],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "getInvalidCount",
            "outputs": [{"internalType": "uint64", "name": "", "type": "uint64"}],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "getSignature",
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "getUrl",
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "getValidCount",
            "outputs": [{"internalType": "uint64", "name": "", "type": "uint64"}],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "isPauser",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "isWhitelistAdmin",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "isWhitelisted",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "pause",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "paused",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
            "name": "removeHash",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
            "name": "removeWhitelisted",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "renouncePauser",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "renounceWhitelistAdmin",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "renounceWhitelisted",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
            "name": "revalidateHash",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
            "name": "revokeHash",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [{
                "internalType": "string",
                "name": "url",
                "type": "string"
            }, {"internalType": "string", "name": "signature", "type": "string"}],
            "name": "setSignature",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "unpause",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    it('decodes URL-safe base64 and sets the ABI correctly', () => {
        const decoded = decodeURIComponent(encodedAbiParam);

        // mock atob + pako.ungzip
        const origAtob = mockAtobWithGzipHeader();
        const pako = require('pako');
        jest.spyOn(pako, 'ungzip').mockReturnValue(JSON.stringify(expectedAbi));

        // minimal entity with web3.Contract stub so createActiveContract can instantiate
        const entity: any = {
            setProvider: jest.fn(), web3: {
                eth: {
                    Contract: function (json: any, addr: any) {
                        (this as any).json = json;
                        (this as any).addr = addr;
                    }
                }
            }, currentBlock: 0, isConnectionWorking: () => false, isSyncing: () => false
        };

        const r = new Reader(makeRoute({
            abi: decoded,
            contract: '0x8F477FEF656d327259a73beDFd40Ff2Da3429D10',
            provider: 'https://leopold-node3-rpc-stg.cert4trust.de',
            start: '529000'
        }), entity as any);

        expect(r.abi).toBeDefined();
        expect(() => JSON.parse(r.abi)).not.toThrow();
        expect(JSON.parse(r.abi)).toEqual(expectedAbi);

        restoreAtob(origAtob);
    });

    it('encodes ABI JSON into url-safe base64 matching URL param', () => {
        const abiStr = JSON.stringify(expectedAbi);
        const pako = require('pako');
        // compress using pako.gzip to get Uint8Array
        const compressedGzip = (pako as any).gzip(abiStr);
        const bufGzip = Buffer.from(compressedGzip);

        // also try zlib/deflate since some tooling uses deflate (starts with 'eJ')
        const compressedDeflate = (pako as any).deflate(abiStr);
        const bufDeflate = Buffer.from(compressedDeflate);

        const decoded = decodeURIComponent(encodedAbiParam);
        const decodedBuf = normalizeUrlSafeBase64ToBuffer(decoded);
        const matches = decodedBuf.equals(bufGzip) || decodedBuf.equals(bufDeflate);
        expect(matches).toBe(true);
    });

});
