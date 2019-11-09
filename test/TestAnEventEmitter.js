const EventEmitter = artifacts.require("EventEmitter");
const truffleAssert = require('truffle-assertions');

/** Expected number of counter */
var eCount = 0;

/** The Contract's instance */
var eventEmitter;

global.CONTRACT_ADDRESS ='';

async function assertContractCount() {
    assert.equal(await eventEmitter.getCount.call(), eCount, "Wrong number of created contracts");
}

contract('EventEmitter', async () => {

    before(async () => {
        eventEmitter = await EventEmitter.new();
      });

    describe("1.1 Basic", function () {

        it("1.1.1 has been created", async () => {
            global.CONTRACT_ADDRESS = eventEmitter.address;
            console.log('        ' + global.CONTRACT_ADDRESS);
            await assertContractCount();
        });

        it("1.1.2 should emit ConstructorDone event", async () => {
            // Get the hash of the deployment transaction
            let txHash = eventEmitter.transactionHash;

            // Get the transaction result using truffleAssert
            let result = await truffleAssert.createTransactionResult(eventEmitter, txHash);

            // Check event
            truffleAssert.eventEmitted(result, 'ConstructorDone', (ev) => {
                return true;
            });
        });
    });

    describe("1.2 Check calls of increment()", function () {
        it("1.2.1 first call should increase the counts correctly", async () => {
            // Pre-Conditions
            await assertContractCount();

            // Creation
            let tx = await eventEmitter.increment();
            eCount++;

            // Expected Event
            truffleAssert.eventEmitted(tx, 'Counter', (ev) => {
                return parseInt(ev.count) === eCount;
            });

            // Post-Conditions
            await assertContractCount();
        });

        it("1.2.2. second call should increase the counts correctly", async () => {
            // Pre-Conditions
            await assertContractCount();

            // Creation
            let tx = await eventEmitter.increment();
            eCount++;

            // Expected Event
            truffleAssert.eventEmitted(tx, 'Counter', (ev) => {
                return parseInt(ev.count) === eCount;
            });

            // Post-Conditions
            await assertContractCount();
        });

        it("1.2.3. third call should increase the counts correctly", async () => {
            // Pre-Conditions
            await assertContractCount();

            // Creation
            let tx = await eventEmitter.increment();
            eCount++;

            // Expected Event
            truffleAssert.eventEmitted(tx, 'Counter', (ev) => {
                return parseInt(ev.count) === eCount;
            });

            // Post-Conditions
            await assertContractCount();
        });
    });
});




