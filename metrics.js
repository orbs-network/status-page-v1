const { getStatus, getEndpoint } = require("@orbs-network/orbs-nebula/lib/metrics");
const { map } = require("lodash");
const fetch = require("node-fetch");

const services = ["management-service", "signer"];

function collectMetrics(db, recordsRetention, ips, vchains) {
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

    db.removeOldRecords(recordsRetention);
}

module.exports = {
    collectMetrics,
}