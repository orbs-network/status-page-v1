const db = require("knex")(require("./knexfile")[process.env.NODE_ENV || "development"]);
const { get, reduce, map, intersection, reject, isEmpty, find } = require("lodash");

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

async function addServiceStatus(batch, validator, service, data) {
    console.log(data);
    const { Timestamp, Status, Error, Payload } = data;

    return db("service_status").insert({
        batch,
        validator,
        service,
        status: Status,
        error: Error,
        created_at: Timestamp,
        data: Payload,
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

async function getSubscribers(validators) {
    return await db("telegram_notifications").whereIn("validator", validators).select("telegramId", "validator").distinct();
}

async function getLastBatch() {
    return (await db("status").max("batch"))[0].max || 0;
}

async function getStatus(lastBatch, hosts) {
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

async function detectGoingDown(lastBatch) {
    return detectChanges(lastBatch, "green", "red");
}

async function detectGoingUp(lastBatch) {
    return detectChanges(lastBatch, "red", "green");
}

async function detectChanges(lastBatch, beforeState, afterState) {
    const transform = (status, row) => {
        const validatorBucket = status[row.validator] || [];
        validatorBucket.push(row.vchain);
        status[row.validator] = validatorBucket;
        return status;
    };

    const afterRaw = await db("status").where({ batch: lastBatch - 1, status: afterState }).select("validator", "vchain", "status").distinct();
    const beforeRaw = await db("status").where({ batch: lastBatch - 2, status: beforeState }).select("validator", "vchain", "status").distinct();

    const after = reduce(afterRaw, transform, {});
    const before = reduce(beforeRaw, transform, {});

    return reject(map(after, (vchains, validator) => {
        const redVchains = intersection(vchains, before[validator]);
        if (!isEmpty(redVchains)) {
            return { validator, vchains: redVchains }
        }
    }), isEmpty);
}

module.exports = {
    migrate,
    addStatus,
    addServiceStatus,
    getLastBatch,
    getStatus,
    removeOldRecords,

    subscribe,
    unsubscribe,
    getSubscription,
    getSubscribers,

    detectGoingDown,
    detectGoingUp,
}