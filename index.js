const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const fs = require('fs');
const _ = require('lodash');
const { getStatus, getEndpoint } = require('nebula/lib/metrics');

const vchains = process.env.VCHAINS.split(",");
const ips = JSON.parse(process.env.IPS);

const state = {
    
};

function query() {
    _.map(ips, async (ip, node) => {
        const aggregatedRequest = _.reduce(vchains, (result, vchain) => {
            result[vchain] = getEndpoint(ip, vchain);
            return result;
        }, {});

        
        state[node] = await getStatus(aggregatedRequest, 5000, 60000);
        console.log(state[node]);
    })
}

function placeholder() {
    _.map(ips, async (ip, node) => {
        state[node] = _.reduce(vchains, (result, vchain) => {
            result[vchain] = {};
            return result;
        }, {});
    });
}

placeholder();

setInterval(query, 30000);
query();

app.get('/', (req, res) => {
    const template = _.template(fs.readFileSync('./templates/index.html').toString());
    res.send(template({
        state,
        vchains
    }));
});

app.listen(port, () => console.log(`Status page listening on port ${port}!`))
