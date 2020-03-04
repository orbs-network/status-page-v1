const Orbs = require("orbs-client-sdk");
const fetch = require("node-fetch");
const sender = Orbs.createAccount();

const virtualChainId = 1100000;
const client = new Orbs.Client("http://3.134.6.50/vchains/1100000", virtualChainId, "MAIN_NET", new Orbs.LocalSigner(sender));

const orbsVotingContractName = "_Elections";

async function getElectionsStatus() {
    const query = await client.createQuery(orbsVotingContractName, "getCurrentElectionBlockNumber", []);
    const responseElectionBlock = await client.sendQuery(query);

    const queryProcessingStarted = await client.createQuery(orbsVotingContractName, "hasProcessingStarted", []);
    const responseProcessingStarted = await client.sendQuery(queryProcessingStarted);

    const inProgress = !(Number(responseProcessingStarted.outputArguments[0].value) === 0);

    const ethResp = await fetch('http://eth4.orbs.com:8080');
    const eth = await ethResp.json();

    return {
        eth,
        elections: {
            next: Number(responseElectionBlock.outputArguments[0].value),
            inProgress,
        }
    };
}

module.exports = {
    getElectionsStatus,
};