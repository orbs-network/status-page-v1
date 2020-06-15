const express = require("express");
const port = process.env.PORT || 5000;
const { map, fromPairs, values, sortBy, last, get } = require("lodash");
const { getElectionsStatus } = require('./elections');
const { version } = require('./package.json');
const { collectMetrics } = require("./metrics");
const path = require('path');

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

        const currentVirtualChains = get(last(sortBy(map(values(serviceStatus), "management-service"), s => {
            return new Date(s.created_at).getTime();
        })), "data.CurrentVirtualChains");

        res.send({
            version,
            vchains: currentVirtualChains,
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

    app.use(express.static(path.join(__dirname, 'build')));
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

    // Handles any requests that don't match the ones above
    app.get('*', (req,res) =>{
        res.sendFile(path.join(__dirname+'/client/build/index.html'));
    });

    return app;
}

if (!module.parent) {
    console.log('No Parent')
    const app = main(express());
    app.listen(port, () => console.log(`Status page listening on port ${port}!`));
} else {
    module.exports = main;
}