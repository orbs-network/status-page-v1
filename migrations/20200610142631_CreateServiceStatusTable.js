exports.up = function (knex) {
    return knex.schema.createTable("service_status", table => {
        table.integer("batch").notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.text("validator").notNullable();
        table.text("service").notNullable();
        table.text("status").nullable();
        table.text("error").nullable();
        table.json("data").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("service_status");
};
