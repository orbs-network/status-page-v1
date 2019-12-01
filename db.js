const db = require("knex")(require("./knexfile")[process.env.NODE_ENV || "development"]);
const { get, reduce } = require("lodash");

async function migrate() {
    return db.migrate.latest();
}

async function addStatus(batch, validator, vchain, data) {
    const { status, blockHeight, version, commit, ethereum } = data;

    return db("status").insert({
        batch,
        validator,
        vchain,
        status,
        blockHeight,
        version,
        commit,
        ethereumSyncStatus: get(ethereum, "syncStatus"),
    });
}

async function getLastBatch() {
    return (await db("status").max("batch"))[0].max || 0;
}

async function getStatus() {
    const lastBatch = await getLastBatch();
    const rows = await db("status").where({ batch: lastBatch - 1 }).orderBy("validator", "asc");

    return reduce(rows, (status, row) => {
        const validatorBucket = status[row.validator] || {};
        validatorBucket[row.vchain] = row;
        status[row.validator] = validatorBucket;
        return status;
    }, {});
}

async function removeOldRecords(batches) {
    const lastBatch = await getLastBatch();
    return db("status").where("batch", "<", lastBatch - batches).del();
}

module.exports = {
    migrate,
    addStatus,
    getLastBatch,
    getStatus,
    removeOldRecords
}