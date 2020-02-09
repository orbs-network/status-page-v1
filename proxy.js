const status = require('./fixtures/status.json');

module.exports = function (app) {
    app.get('/status.json', (req, res) => {
        res.send(200, status);
    });
    return app;
};