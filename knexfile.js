// Update with your config settings.

module.exports = {
  development: {
    client: 'pg',
    connection: {
      database: 'status_page',
      user: 'username',
      password: 'password',
      host: '127.0.0.1',
      port: 5432,
    },
    pool: {
      min: 0,
      max: 100,
      propagateCreateError: false
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      tableName: 'migrations'
    },
    ssl: true
  }
};
