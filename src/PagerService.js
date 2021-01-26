const TIMEOUT = 15 // minutes

class PagerService {
    constructor(ServicesProvider, EPService, AlertingService, ConsoleAdapter, PersistenceAdapter, TimerAdapter) {
        this.ServicesProvider = ServicesProvider
        this.EPService = EPService
        this.AlertingService = AlertingService
        this.ConsoleAdapter = ConsoleAdapter
        this.PersistenceAdapter = PersistenceAdapter
        this.TimerAdapter = TimerAdapter

        this.AlertingService.on("serviceDisfunction", this.handleDisfunction.bind(this))
        this.TimerAdapter.on("acknowledgeTimeout", this.handleTimeout.bind(this))
        this.ConsoleAdapter.on("confirmAcknowledge", this.handleAcknowledge.bind(this))
        this.ConsoleAdapter.on("healthyService", this.handleHealthyService.bind(this))
    }

    async handleDisfunction(serviceID, AlertMessage) {
        var service = await this.ServicesProvider.get(serviceID)
        if (!service || !service.isHealthy()) { return }
        await service.setHealthyState(false)
        // 1- Get escalation policy and the targets list
        var escalationPolicy = await this.EPService.getEscalationPolicyByServiceID(serviceID)
        var targets = await escalationPolicy.getLevel(0).getTargets()

        // 2 & 3- Notify all targets of the proper level & Set Acknowledgement Timeout
        await this.notifyTargetsAndSetTimeout(targets, serviceID, AlertMessage)


        // 4- Store disfunction on DB
        await this.PersistenceAdapter.insertOrUpdateDisfunction({
            serviceID: serviceID, // search by this key
            escalationLevel: 0,
            message: AlertMessage,
            acknowledge: false
        })
    }

    async handleAcknowledge(serviceID) {
        await this.PersistenceAdapter.confirmAcknowledge({
            serviceID: serviceID,
            acknowledge: true
        })
    }

    async handleTimeout(serviceID) {
        // 1- Check disfunction has not been already acknowledged
        var disfunction = await this.PersistenceAdapter.getDisfunction({serviceID: serviceID})
        if (!disfunction || disfunction.acknowledge) { return }
        
        // 2- Check there is a next escalationLevel
        var escalationPolicy = await this.EPService.getEscalationPolicyByServiceID(serviceID)
        if (!await escalationPolicy.hasLevel(++disfunction.escalationLevel)) { return }
        var targets = await escalationPolicy.getLevel(disfunction.escalationLevel).getTargets()

        // 3- Notify next targets and set a new timeout
        await this.notifyTargetsAndSetTimeout(targets, serviceID, disfunction.message)

        // 4- Update state in DB
        await this.PersistenceAdapter.insertOrUpdateDisfunction({
            serviceID: serviceID, // search by this key
            escalationLevel: disfunction.escalationLevel,
            message: disfunction.message,
            // acknowledge: false // DON'T ADDED because it could cause concurrency issues after step 1
        })
    }

    async notifyTargetsAndSetTimeout(targets, serviceID, AlertMessage) {
        // 2- Notify all targets of the proper level
        var promises = targets.map(async target => {
            await target.notify(serviceID, AlertMessage)
        })
        await Promise.all(promises)

        // 3- Set Acknowledgement Timeout
        await this.TimerAdapter.setNewTimeout(TIMEOUT, serviceID)
    }

    async handleHealthyService(serviceID) {
        await this.PersistenceAdapter.confirmAcknowledge({
            serviceID: serviceID,
            acknowledge: true
        })
        var service = await this.ServicesProvider.get(serviceID)
        if (!service) { return }
        await service.setHealthyState(true)
    }
}

module.exports = { PagerService }