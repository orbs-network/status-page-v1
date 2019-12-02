const express = require("express")
const app = express()
const port = process.env.PORT || 3000;
const fs = require("fs");
const _ = require("lodash");
const { getStatus, getEndpoint } = require("@orbs-network/orbs-nebula/lib/metrics");

const vchains = process.env.VCHAINS.split(",");
const ips = JSON.parse(process.env.IPS || `{"nodes":[]}`).nodes;
const recordsRetention = Number(process.env.RETENTION || 60);

const db = require("./db");

function query() {
    _.map(ips, async ({ name, host }) => {        
        const batch = await db.getLastBatch();

        _.map(vchains, async (vchain) => {
            try {
                const status = await getStatus({data: getEndpoint(host, vchain)}, 5000, 60000);
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

setInterval(query, 60000);
db.migrate().then(query);

setInterval(cleanup, 60000);

require("./telegram"); // start telegram bot

app.use(express.static("public"));

app.get("/", async (req, res) => {
    const template = _.template(fs.readFileSync("./templates/index.html").toString());
    const state = await db.getStatus();

    res.send(template({
        state,
        vchains,
        ips,
        getEndpoint
    }));
});

app.listen(port, () => console.log(`Status page listening on port ${port}!`))
