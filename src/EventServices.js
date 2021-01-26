const {EventEmitter} = require("events")

class AlertingService extends EventEmitter {
    constructor() {
        super();
    }
}

class ConsoleAdapter extends EventEmitter {
    constructor() {
        super();
    }
}

class TimerAdapter extends EventEmitter {
    constructor() {
        super();
        this.isSet = {}
    }

    setNewTimeout(minutes, serviceID) {
        this.isSet[serviceID] = true
    }
}

module.exports = { AlertingService, ConsoleAdapter, TimerAdapter }