const express = require("express");
const port = process.env.PORT || 3000;
const { map } = require("lodash");
const { getStatus, getEndpoint } = require("@orbs-network/orbs-nebula/lib/metrics");
const { getElectionsStatus } = require('./elections');
const { version } = require('./package.json');
const fetch = require("node-fetch");

const vchains = process.env.VCHAINS.split(",");
const descriptions = JSON.parse(process.env.VCHAIN_DESCRIPTIONS || `{}`);
const prismUrls = JSON.parse(process.env.PRISM_URLS || `{}`);
const ips = JSON.parse(process.env.IPS || `{"nodes":[]}`).nodes;
const recordsRetention = Number(process.env.RETENTION || 60);

const db = require("./db");

const services = ["management-service", "signer"];

function collectMetrics() {
    map(ips, async ({ name, host }) => {
        const batch = await db.getLastBatch();

        map(services, async (service) => {
            try {
                const request = await fetch(`http://${host}/services/${service}/status`);
                if (request.ok) {
                    const status = await request.json();
                    await db.addServiceStatus(batch + 1, name, service, status);
                }
            } catch (e) {
                console.log(e);
            }
        })

        map(vchains, async (vchain) => {
            try {
                const status = await getStatus({ data: getEndpoint(host, vchain) }, 1000, 60000);
                await db.addStatus(batch + 1, name, Number(vchain), status.data);
            } catch (e) {
                console.log(e);
            }
        })
    })
}

function cleanup() {
    db.removeOldRecords(recordsRetention);
}

async function showStatus(req, res) {
    const statusId = Number(req.params.statusId);
    const lastBatch = await db.getLastBatch();
    const batch = statusId || lastBatch;
    const status = await db.getStatus(batch, ips);

    res.send({
        version,
        batch,
        lastBatch,
        vchains,
        status,
        descriptions,
        prisms: prismUrls,
        hosts: ips,
    });
}

function main(app) {
    setInterval(collectMetrics, 60000);
    db.migrate().then(collectMetrics);

    setInterval(cleanup, 60000);

    require("./telegram"); // start telegram bot

    app.use(express.static("public"));

    app.get("/status/:statusId.json", showStatus);
    app.get("/status.json", showStatus);
    app.get("/elections.json", async (_, res) => {
        const result = await getElectionsStatus(); // Never rejected

        // Check if we have no results to signal an HTTP Error 500
        if (!result.ok) {
            res.status(500);
        }
        res.json(result);
    });

    return app;
}

if (!module.parent) {
    const app = main(express());
    app.listen(port, () => console.log(`Status page listening on port ${port}!`));
} else {
    module.exports = main;
}