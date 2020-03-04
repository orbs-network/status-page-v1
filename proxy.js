const status = require('./fixtures/status.json');
const eth = require('./fixtures/eth.json');

module.exports = function (app) {
    app.get('/status.json', (req, res) => {
        setTimeout(() => {
            res.status(200).send(status);
        }, 3000);
    });

    app.get('/elections.json', (req, res) => {
        res.status(200).send({
            eth,
            elections: {
                next: 9600700,
                inProgress: false,
            }
        });
    });
    return app;
};