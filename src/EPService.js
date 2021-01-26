class EPService {
    constructor() {
        this.escalationPolicies = {}
    }

    addNewPolicy(serviceID, numLevels) {
        this.escalationPolicies[serviceID] = new EscalationPolicy(numLevels)
    }

    getEscalationPolicyByServiceID(serviceID) {
        return this.escalationPolicies[serviceID]
    }
}

class EscalationPolicy {
    constructor(numLevels) {
        this.hasNotified = false
        this.levels = []
        while(numLevels > 0) {
            this.levels.push(new Level())
            --numLevels
        }
    }

    hasLevel(level) {
        return level < this.levels.length
    }

    getLevel(level) {
        if (this.hasLevel(level)) return this.levels[level]
        return null
    }
}

class Level {
    constructor() {
        this.hasNotified = false
        this.targets = [new Target(this)]
    }

    getTargets() {
        return this.targets
    }
}

class Target {
    constructor(level) {
        this.level = level
        this.hasNotified = false
    }
    notify() {
        this.level.hasNotified = true
        this.hasNotified = true
    }
}

module.exports = {EPService}