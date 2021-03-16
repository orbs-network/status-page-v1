const express = require("express");
const fetch = require('node-fetch');
const _ = require("lodash");
const dotenv = require('dotenv');
dotenv.config();

const { TaskLoop } = require('./helpers');

const port = process.env.PORT || 3000;
const vchains = process.env.VCHAINS.split(",");
const descriptions = JSON.parse(process.env.VCHAIN_DESCRIPTIONS || `{}`);
const prismUrls = JSON.parse(process.env.PRISM_URLS || `{}`);
const ips = JSON.parse(process.env.IPS || `{"nodes":[]}`).nodes;

let currentStatus = {};
async function runloop() {
    currentStatus = await collectMetrics();
    console.log(JSON.stringify(currentStatus, null, 2))
}

async function collectMetrics() {
    const timeNowNano = new Date().getTime() * 1000;
    let newStatus = {};
    const txs = [];
    _.map(ips, async ({ name, host }) => {
        _.map(vchains, async (vchain) => {
            txs.push(fetchJson(`http://${host}/vchains/${vchain}/metrics`).then(status => {
                const blockTime = _.isObject(status['BlockStorage.LastCommitted.TimeNano']) ? status['BlockStorage.LastCommitted.TimeNano'].Value : 0
                const validatorBucket = newStatus[name] || {};
                
                validatorBucket[vchain] = {
                    blockHeight: _.isObject(status['BlockStorage.BlockHeight']) ? status['BlockStorage.BlockHeight'].Value : 0,
                    blockTimeNano: blockTime,
                    status: (blockTime + 600000000) > timeNowNano ? "green" : "red",
                    version: _.isObject(status['Version.Semantic']) ? status['Version.Semantic'].Value : "",
                    commit: _.isObject(status['Version.Commit']) ? status['Version.Commit'].Value : "",
                };
                newStatus[name] = validatorBucket;
            }))
        });
    });
    try {
        await Promise.all(txs);
    } catch (e) {
        console.error(e)
    }
    return newStatus;
}

async function fetchJson(url) {
    const response = await fetch(url, { timeout: 15000 });
    if (response.ok && String(response.headers.get('content-type')).toLowerCase().includes('application/json')) {
        try {
            const res = await response.json();
            if (res.error) {
                throw new Error(`Invalid response (json contains error) for url '${url}`);
            }
            return res;
        } catch (e) {
            throw new Error(`Invalid response (not json) for url '${url}`);
        }  
    } else {
        const t = await response.text();
        throw new Error(`Invalid response for url '${url}': Status Code: ${response.status}, Content-Type: ${response.headers.get('content-type')}, Content: ${t.length > 150 ? t.substring(0,150) + '...' : t}`);
    }
}

async function showStatus(req, res) {
    res.status(200).send({
        vchains,
        currentStatus,
        descriptions,
        prisms: prismUrls,
        hosts: ips,
    });
}

function main(app) {
    const processorTask = new TaskLoop(() => runloop(), 30000);
    processorTask.start();
    app.use(express.static("public"));
    app.get("/status.json", showStatus);
    return app;
}

if (!module.parent) {
    const app = main(express());
    app.listen(port, () => console.log(`Status page listening on port ${port}!`));
} else {
    module.exports = main;
}