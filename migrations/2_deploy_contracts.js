var EventEmitter=artifacts.require ("../contracts/EventEmitter.sol");
module.exports = function(deployer) {
    deployer.deploy(EventEmitter);
};