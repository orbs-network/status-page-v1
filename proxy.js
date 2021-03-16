const status = require('./fixtures/status.json');

module.exports = function (app) {
    app.get('/status.json', (req, res) => {
        setTimeout(() => {
            res.status(200).send(status);
        }, 3000);
    });

    return app;
};