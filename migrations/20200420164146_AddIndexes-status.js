
const COLS_BATCH_VALIDATOR = ["batch", "validator"];
const COLS_BATCH_STATUS = ["batch", "status"];

exports.up = function(knex) {
    return knex.schema.table("status", table => {
        table.index(COLS_BATCH_VALIDATOR);
        table.index(COLS_BATCH_STATUS);
    });
};

exports.down = function(knex) {
    return knex.schema.table("status", table => {
        table.dropIndex(COLS_BATCH_VALIDATOR);
        table.dropIndex(COLS_BATCH_STATUS);
    });
};
