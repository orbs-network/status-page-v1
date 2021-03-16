class TaskLoop {
    constructor(task, pause) {
        this.task = task;
        this.pause = pause;
        this.started = false;
        this.handle = undefined;
    }

    runTask = () => {
        this.task().then(
        () => {
            if (this.started) {
            this.handle = setTimeout(this.runTask, this.pause);
            }
        },
        (err) => {
            console.error(`Error in runTask: ${errorString(err)}.`);
            if (this.started) {
            this.handle = setTimeout(this.runTask, this.pause);
            }
        }
        );
    };

    start = () => {
        if (!this.started) {
        this.started = true;
        this.handle = setTimeout(this.runTask, 0);
        }
    };

    stop = () => {
        this.started = false;
        if (this.handle !== undefined) {
        clearTimeout(this.handle);
        }
    };
}

function errorString(e) {
    return (e && e.stack) || '' + e;
}

module.exports = {
    TaskLoop,
};

  