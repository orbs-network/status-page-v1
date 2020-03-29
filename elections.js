const Orbs = require("orbs-client-sdk");
const fetch = require("node-fetch");
const sender = Orbs.createAccount();

const virtualChainId = 1100000;
const client = new Orbs.Client("http://3.134.6.50/vchains/1100000", virtualChainId, "MAIN_NET", new Orbs.LocalSigner(sender));

const orbsVotingContractName = "_Elections";
let currentElectionsData;

function nowTime() {
    return Math.floor(Date.now() / 1000);
}

const initElectionsDataPromise = new Promise((res, rej) => {
    const timerStartTs = nowTime();
    let initPid = setInterval(() => {
        if (currentElectionsData != undefined) { // undefined and null
            clearInterval(initPid);
            res(currentElectionsData);
        }

        const nowTs = nowTime();
        if (nowTs - timerStartTs > 25) {
            clearInterval(initPid);
            const message = 'elections status unknown at startup, check logs';
            console.error(message);
            res({
                ok: false,
                message,
            });
        }
    }, 50);
});

async function getServerElections() {
    try {
        const query = await client.createQuery(orbsVotingContractName, "getCurrentElectionBlockNumber", []);
        const responseElectionBlock = await client.sendQuery(query);

        const queryProcessingStarted = await client.createQuery(orbsVotingContractName, "hasProcessingStarted", []);
        const responseProcessingStarted = await client.sendQuery(queryProcessingStarted);

        const _isProcessingPeriod = await client.createQuery(orbsVotingContractName, "isProcessingPeriod", []);
        const responseIsProcessingPeriod = await client.sendQuery(_isProcessingPeriod);

        const getCurrentEthereumBlockNumberQuery = await client.createQuery(orbsVotingContractName, "getCurrentEthereumBlockNumber", []);
        const responsegetCurrentEthereumBlockNumber = await client.sendQuery(getCurrentEthereumBlockNumberQuery);

        const ethereumBlockNumberPerOrbs = Number(responsegetCurrentEthereumBlockNumber.outputArguments[0].value);
        const isProcessingPeriod = Number(responseIsProcessingPeriod.outputArguments[0].value);
        const inProgress = !(Number(responseProcessingStarted.outputArguments[0].value) === 0);

        const ethResp = await fetch('http://eth.orbs.com:8080');
        const eth = await ethResp.json();

        return {
            ok: true,
            eth,
            elections: {
                ethereumBlockNumberPerOrbs,
                isProcessingPeriod,
                next: Number(responseElectionBlock.outputArguments[0].value),
                inProgress,
            }
        };
    } catch (err) {
        console.error(`getServerElections failed: ${JSON.stringify(err)}`);
        return {
            ok: false,
            err,
        };
    }
}

const poller = async () => {
    try {
        let result = await getServerElections();
        if (result.ok) {
            currentElectionsData = Object.assign({}, result, { sampleTs: nowTime() });
        }
    } catch (err) {
        console.log('Poller round failed', err);
    }

    // Schedule another polling round
    pid = setTimeout(poller, 10 * 1000);
};

let pid;

// Setup managed polling
(function () {
    try {
        poller();
    } catch (err) {
        console.log('Elections poller failed to init on first load!', err);
    }
})();

function getElectionsStatus() {
    if (!currentElectionsData) {
        return initElectionsDataPromise;
    }

    return Promise.resolve(currentElectionsData);
}

module.exports = {
    getElectionsStatus,
};