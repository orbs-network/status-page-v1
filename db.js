const db = require("knex")(require("./knexfile")[process.env.NODE_ENV || "development"]);
const { get, reduce, map, intersection, reject, isEmpty } = require("lodash");

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

async function subscribe(validator, telegramId, telegramUsername) {
    return db("telegram_notifications").insert({
        validator,
        telegramId,
        telegramUsername,
    });
}

async function unsubscribe(validator, telegramId) {
    return db("telegram_notifications").where({
        validator,
        telegramId,
    }).del();
}

async function getSubscription(options) {
    return db("telegram_notifications").where(options).first();
}

async function getSubscribers(options) {
    return map(await db("telegram_notifications").where(options).select("telegramId"), "telegramId");
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

async function detectGoingDown() {
    const transform = (status, row) => {
        const validatorBucket = status[row.validator] || [];
        validatorBucket.push(row.vchain);
        status[row.validator] = validatorBucket;
        return status;
    };

    const lastBatch = await getLastBatch();
    const redNow = await db("status").where({ batch: lastBatch - 1, status: "red" }).select("validator", "vchain", "status").distinct();
    const wereGreen = await db("status").where({ batch: lastBatch - 2, status: "green" }).select("validator", "vchain", "status").distinct();

    const redStatus = reduce(redNow, transform, {});
    const greenStatus = reduce(wereGreen, transform, {});

    return reject(map(redStatus, (vchains, validator) => {
        const redVchains = intersection(vchains, greenStatus[validator]);
        if (!isEmpty(redVchains)) {
            return { validator, vchains: redVchains }
        }
    }), isEmpty);
}

module.exports = {
    migrate,
    addStatus,
    getLastBatch,
    getStatus,
    removeOldRecords,

    subscribe,
    unsubscribe,
    getSubscription,
    getSubscribers,

    detectGoingDown,
}