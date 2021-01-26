class ServicesProvider {
    constructor() {
        this.services = {}
    }

    get(serviceID) {
        return this.services[serviceID]
    }

    createNewService(serviceID) {
        this.services[serviceID] = new Service()
    }
}

class Service {
    constructor() {
        this.healthy = true
    }

    isHealthy() {
        return this.healthy
    }

    setHealthyState(healthy) {
        this.healthy = healthy
    }
}

module.exports = {ServicesProvider}