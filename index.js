const express = require("express");
const port = process.env.PORT || 3000;
const { map, fromPairs } = require("lodash");
const { getElectionsStatus } = require('./elections');
const { version } = require('./package.json');
const { collectMetrics } = require("./metrics");

const vchains = process.env.VCHAINS.split(",");
const descriptions = JSON.parse(process.env.VCHAIN_DESCRIPTIONS || `{}`);
const prismUrls = JSON.parse(process.env.PRISM_URLS || `{}`);
const ips = JSON.parse(process.env.IPS || `{"nodes":[]}`).nodes;
const recordsRetention = Number(process.env.RETENTION || 60);

const db = require("./db");

async function showStatus(req, res) {
    const batch = await db.getLastBatch();
    const status = await db.getStatus(batch, ips);
    const serviceStatus = await db.getServiceStatus(batch);

    const model = fromPairs(map(ips, ( { name, host } ) => {
        return [name, {
                vchains: status[name],
                services: serviceStatus[name],
            }
        ]
    }));

    res.send({
        version,
        vchains,
        status: model,
        descriptions,
        prisms: prismUrls,
        hosts: ips,
    });
}

function main(app) {
    const poll = () => collectMetrics(db, recordsRetention, ips, vchains);
    setInterval(poll, 60000);
    db.migrate().then(poll);

    app.use(express.static("public"));

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