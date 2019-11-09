pragma solidity 0.5.12;

contract EventEmitter {

    // ---- EVENTS -----------------------------------------------------------------------------------------------------
    event ConstructorDone(address owner);
    event Counter(uint64 count);

    // ---- FIELDS -----------------------------------------------------------------------------------------------------
    uint64 private _count = 0;

    // ---- CONSTRUCTOR ------------------------------------------------------------------------------------------------
    constructor() public {
        emit ConstructorDone(msg.sender);
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
