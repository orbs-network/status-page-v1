const Promise = require("bluebird");

const { 
    getBlockHeight, waitUntilSync, getCommit, getVersion, getEndpoint, getEthereumStats,
} = require("@orbs-network/orbs-nebula/lib/metrics");
const { map, fromPairs } = require("lodash");

async function determineStatus(endpoint, pollingInterval, timeout, blockHeightDiff) {
    const startingBlockHeight = await getBlockHeight(endpoint);
    try {
        await waitUntilSync(endpoint, startingBlockHeight + blockHeightDiff, pollingInterval, timeout);
        return "green";
    } catch (e) {
        return "red";
    }
}

async function getStatus(ips, pollingInterval, timeout, blockHeightDiff) {
    blockHeightDiff = blockHeightDiff || 2;
    const results = map(ips, async (endpoint, name) => {
        const status = await determineStatus(endpoint, pollingInterval, timeout, blockHeightDiff);
        return [name, Promise.props({
            status,
            blockHeight: getBlockHeight(endpoint),
            version: getVersion(endpoint),
            commit: getCommit(endpoint),
            // ethereum: getEthereumStats(endpoint),
        })];
    });

    return Promise.props(fromPairs(await Promise.all(results)));
}

module.exports = {
    getStatus,
    getEndpoint,
}

if (!module.parent) {
    const poll = async () => {
        console.log(await getStatus({
            "pulse": "3.17.198.12/vchains/1100000",
            "dappsters": "3.210.161.251/vchains/1960000",
        }, 1000, 30000, 2));
    };
    poll()
    setInterval(poll, 30000)
}