
exports.up = function (knex) {
    return knex.schema.createTable("status", table => {
        table.integer("batch").notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.text("validator").notNullable();
        table.integer("vchain").notNullable();
        table.biginteger("blockHeight").notNullable();
        table.text("status").notNullable();
        table.text("version").nullable();
        table.text("commit").nullable();
        table.text("ethereumSyncStatus").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("status");
};


/**  
    { blockHeight: 690447,
     status: 'green',
     version: 'v1.3.2',
     commit: '23a02f94ee9a6fc2a6eae317c9012a62f337ae33',
     ethereum:
      { lastBlock: 9031832,
        syncStatus: 'success',
        txReceiptsStatus: 'success' } } }
 */