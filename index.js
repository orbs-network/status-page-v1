const express = require("express");
const port = process.env.PORT || 3000;
const _ = require("lodash");
const { getStatus, getEndpoint } = require("@orbs-network/orbs-nebula/lib/metrics");

const vchains = process.env.VCHAINS.split(",");
const descriptions = JSON.parse(process.env.VCHAIN_DESCRIPTIONS || `{}`);
const ips = JSON.parse(process.env.IPS || `{"nodes":[]}`).nodes;
const recordsRetention = Number(process.env.RETENTION || 60);

const db = require("./db");

function collectMetrics() {
    _.map(ips, async ({ name, host }) => {
        const batch = await db.getLastBatch();

        _.map(vchains, async (vchain) => {
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
        batch,
        lastBatch,
        vchains,
        status,
        descriptions,
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
    
    return app;
}

if (!module.parent) {
    const app = main(express());
    app.listen(port, () => console.log(`Status page listening on port ${port}!`));
} else {
    module.exports = main;
}