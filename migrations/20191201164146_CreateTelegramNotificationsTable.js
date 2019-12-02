
exports.up = function(knex) {
    return knex.schema.createTable("telegram_notifications", table => {
        table.text("validator").notNullable();
        table.text("telegramId").notNullable();
        table.text("telegramUsername");
        table.unique(["validator", "telegramId"]);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable("telegram_notifications");
};
