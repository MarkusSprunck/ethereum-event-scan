pragma solidity 0.5.12;

contract EventEmitter {

    // ---- EVENTS -----------------------------------------------------------------------------------------------------
    event ConstructorDone(address owner, string message);
    event Counter(uint64 count);

    // ---- FIELDS -----------------------------------------------------------------------------------------------------
    uint64 private _count = 0;
    string constant _message = '0x0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789';

    // ---- CONSTRUCTOR ------------------------------------------------------------------------------------------------
    constructor() public {
        emit ConstructorDone(msg.sender, _message);
    }

    // ---- STATISTICS FUNCTIONS ---------------------------------------------------------------------------------------
    function getCount() public view returns (uint count) {
        return _count;
    }

    // ---- CORE FUNCTIONS ---------------------------------------------------------------------------------------------
    function increment() public {
        _count++;
        emit Counter(_count);
    }
}
