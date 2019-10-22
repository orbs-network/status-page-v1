const express = require("express")
const app = express()
const port = process.env.PORT || 3000;
const fs = require("fs");
const _ = require("lodash");
const { getStatus, getEndpoint } = require("@orbs-network/orbs-nebula/lib/metrics");

const vchains = process.env.VCHAINS.split(",");
const ips = JSON.parse(process.env.IPS || `{"nodes":[]}`).nodes;

const state = {
    
};

function query() {
    _.map(ips, async ({ name, host }) => {
        const aggregatedRequest = _.reduce(vchains, (result, vchain) => {
            result[vchain] = getEndpoint(host, vchain);
            return result;
        }, {});


        state[name] = await getStatus(aggregatedRequest, 5000, 60000);
        console.log(state[name]);
    })
}

function placeholder() {
    _.map(ips, async ({ name, host }) => {
        state[name] = _.reduce(vchains, (result, vchain) => {
            result[vchain] = {};
            return result;
        }, {});
    });
}

placeholder();

setInterval(query, 10000);
query();

app.use(express.static("public"));

app.get("/", (req, res) => {
    const template = _.template(fs.readFileSync("./templates/index.html").toString());
    res.send(template({
        state,
        vchains,
        ips,
        getEndpoint
    }));
});

app.listen(port, () => console.log(`Status page listening on port ${port}!`))
