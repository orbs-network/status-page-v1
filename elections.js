const Orbs = require("orbs-client-sdk");
const fetch = require("node-fetch");
const sender = Orbs.createAccount();

const virtualChainId = 1100000;
const client = new Orbs.Client("http://3.134.6.50/vchains/1100000", virtualChainId, "MAIN_NET", new Orbs.LocalSigner(sender));

const orbsVotingContractName = "_Elections";
let currentElectionsData;

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

        const ethResp = await fetch('http://eth4.orbs.com:8080');
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
        console.error(`There has been a problem getting the latest elections status due to an error: ${JSON.stringify(err)}`);
        return {
            ok: false,
            err,
        };
    }
}

const poller = async () => {
    let result = await getServerElections();
    if (result.ok) {
        currentElectionsData = Object.assign({}, result);
    }
};

let pid = setInterval(poller, 10 * 1000);
poller();

function getElectionsStatus() {
    console.log('getElectionsStatus()');
    if (!currentElectionsData) {
        return {
            ok: false,
            message: 'No elections data registered as of yet..'
        };
    }
    return currentElectionsData;
}

module.exports = {
    getElectionsStatus,
};