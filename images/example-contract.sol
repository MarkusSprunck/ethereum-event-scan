pragma solidity 0.5.2;

contract Foo {

    uint64 private _count = 0;

    event Bee(
        address indexed _from,
        uint _value,
        uint64 __count
    );

    function bee() public payable {
        _count++;
        // here do something else ...
        emit Bee(msg.sender, msg.value, _count);
    }

}




