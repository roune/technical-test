const {test} = require("zora")
const { EPService } = require("../src/EPService")
const { AlertingService, ConsoleAdapter, TimerAdapter } = require("../src/EventServices")
const { PersistenceAdapter } = require("../src/PersistenceAdapter")
const { ServicesProvider } = require("../src/ServicesProvides")

const { PagerService } = require("../src/PagerService") // Module to be tested

async function wait(miliseconds) {
    return new Promise(res => setTimeout(res, miliseconds))
}

const numberOfLevelsOnPolicy = 3

test("USE CASE 1" , async t => {
    t.test("Basic Use Case 1", async t => {
        var epService = new EPService()
        var alertingService = new AlertingService()
        var consoleAdapter = new ConsoleAdapter()
        var timerAdapter = new TimerAdapter()
        var persistenceAdapter = new PersistenceAdapter()
        var servicesProvider = new ServicesProvider()
    
        var pagerService = new PagerService(servicesProvider, epService, alertingService, consoleAdapter, persistenceAdapter, timerAdapter)
    
        const serviceID = 1
        servicesProvider.createNewService(serviceID)
        epService.addNewPolicy(serviceID, numberOfLevelsOnPolicy)
    
        alertingService.emit("serviceDisfunction", serviceID, `Error on service ${serviceID}`)
        await wait(50)
        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID).getLevel(0).hasNotified, "Should have notified level 0")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(1).hasNotified, "Should not have notified level 1")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(2).hasNotified, "Should not have notified level 2")
        t.eq(true, timerAdapter.isSet[serviceID], "Timer should be set")
        t.eq(false, servicesProvider.get(serviceID).isHealthy(), "Service should be unhealthy")
    })
})

test("USE CASE 2" , async t => {
    t.test("Basic Use Case 2", async t => {
        var epService = new EPService()
        var alertingService = new AlertingService()
        var consoleAdapter = new ConsoleAdapter()
        var timerAdapter = new TimerAdapter()
        var persistenceAdapter = new PersistenceAdapter()
        var servicesProvider = new ServicesProvider()

        var pagerService = new PagerService(servicesProvider, epService, alertingService, consoleAdapter, persistenceAdapter, timerAdapter)

        const serviceID = 1
        servicesProvider.createNewService(serviceID)
        epService.addNewPolicy(serviceID, numberOfLevelsOnPolicy)

        alertingService.emit("serviceDisfunction", serviceID, `Error on service ${serviceID}`)
        await wait(50) // Wait to notify. Tests done in Use Case 1
        
        timerAdapter.emit("acknowledgeTimeout", serviceID)
        timerAdapter.isSet[serviceID] = false // to recheck later in test
        await wait(50)
        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID).getLevel(0).hasNotified, "Should have notified level 0")
        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID).getLevel(1).hasNotified, "Should have notified level 1")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(2).hasNotified, "Should not have notified level 2")
        t.eq(true, timerAdapter.isSet[serviceID], "Timer should be set")
        t.eq(false, servicesProvider.get(serviceID).isHealthy(), "Service should remain unhealthy")
    })

    t.test("Having notified last level Use Case 2", async t => {
        var epService = new EPService()
        var alertingService = new AlertingService()
        var consoleAdapter = new ConsoleAdapter()
        var timerAdapter = new TimerAdapter()
        var persistenceAdapter = new PersistenceAdapter()
        var servicesProvider = new ServicesProvider()

        var pagerService = new PagerService(servicesProvider, epService, alertingService, consoleAdapter, persistenceAdapter, timerAdapter)

        const serviceID = 1
        servicesProvider.createNewService(serviceID)
        epService.addNewPolicy(serviceID, numberOfLevelsOnPolicy)

        // Notified level 0
        alertingService.emit("serviceDisfunction", serviceID, `Error on service ${serviceID}`)
        await wait(50) // Wait to notify. Tests done in Use Case 1
        
        // Notified level 1
        timerAdapter.emit("acknowledgeTimeout", serviceID)
        await wait(50) // Wait to notify.
        // Notified level 2
        timerAdapter.emit("acknowledgeTimeout", serviceID)
        await wait(50) // Wait to notify.
        // Set notification to false to recheck on test no one has been notified nor timer set
        epService.getEscalationPolicyByServiceID(serviceID).getLevel(0).hasNotified = false
        epService.getEscalationPolicyByServiceID(serviceID).getLevel(1).hasNotified = false
        epService.getEscalationPolicyByServiceID(serviceID).getLevel(2).hasNotified = false
        timerAdapter.isSet[serviceID] = false
        
        // No notification should be made nor timer
        timerAdapter.emit("acknowledgeTimeout", serviceID)
        await wait(50) // Wait to notify.
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(0).hasNotified, "Should not have notified level 0")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(1).hasNotified, "Should not have notified level 1")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(2).hasNotified, "Should not have notified level 2")
        t.eq(false, timerAdapter.isSet[serviceID], "No Timer should be set")
        t.eq(false, servicesProvider.get(serviceID).isHealthy(), "Service should remain unhealthy")
    })
})

test("USE CASE 3" , async t => {
    t.test("Basic Use Case 3", async t => {
        var epService = new EPService()
        var alertingService = new AlertingService()
        var consoleAdapter = new ConsoleAdapter()
        var timerAdapter = new TimerAdapter()
        var persistenceAdapter = new PersistenceAdapter()
        var servicesProvider = new ServicesProvider()
    
        var pagerService = new PagerService(servicesProvider, epService, alertingService, consoleAdapter, persistenceAdapter, timerAdapter)
    
        const serviceID = 1
        servicesProvider.createNewService(serviceID)
        epService.addNewPolicy(serviceID, numberOfLevelsOnPolicy)
    
        // Notified level 0
        alertingService.emit("serviceDisfunction", serviceID, `Error on service ${serviceID}`)
        await wait(50)
        
        consoleAdapter.emit("confirmAcknowledge", serviceID)
        await wait(50)

        timerAdapter.isSet[serviceID] = false
        timerAdapter.emit("acknowledgeTimeout", serviceID)
        await wait(50)

        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID).getLevel(0).hasNotified, "Should have notified level 0")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(1).hasNotified, "Should not have notified level 1")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(2).hasNotified, "Should not have notified level 2")
        t.eq(false, timerAdapter.isSet[serviceID], "No Timer should be set")
        t.eq(false, servicesProvider.get(serviceID).isHealthy(), "Service should remain unhealthy")
    })
})

test("USE CASE 4" , async t => {
    t.test("Basic Use Case 4", async t => {
        var epService = new EPService()
        var alertingService = new AlertingService()
        var consoleAdapter = new ConsoleAdapter()
        var timerAdapter = new TimerAdapter()
        var persistenceAdapter = new PersistenceAdapter()
        var servicesProvider = new ServicesProvider()
    
        var pagerService = new PagerService(servicesProvider, epService, alertingService, consoleAdapter, persistenceAdapter, timerAdapter)
    
        const serviceID = 1
        servicesProvider.createNewService(serviceID)
        epService.addNewPolicy(serviceID, numberOfLevelsOnPolicy)
    
        // Notified level 0
        alertingService.emit("serviceDisfunction", serviceID, `Error on service ${serviceID}`)
        await wait(50)

        epService.getEscalationPolicyByServiceID(serviceID).getLevel(0).hasNotified = false
        epService.getEscalationPolicyByServiceID(serviceID).getLevel(1).hasNotified = false
        epService.getEscalationPolicyByServiceID(serviceID).getLevel(2).hasNotified = false
        timerAdapter.isSet[serviceID] = false

        // Launch another alert
        alertingService.emit("serviceDisfunction", serviceID, `Error on service ${serviceID}`)
        await wait(50)

        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(0).hasNotified, "Should not have notified level 0 again")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(1).hasNotified, "Should not have notified level 1")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(2).hasNotified, "Should not have notified level 2")
        t.eq(false, timerAdapter.isSet[serviceID], "No New Timer should be set")
        t.eq(false, servicesProvider.get(serviceID).isHealthy(), "Service should remain unhealthy")
    })
})

test("USE CASE 5", async t => {
    t.test("Basic Use Case 5", async t => {
        var epService = new EPService()
        var alertingService = new AlertingService()
        var consoleAdapter = new ConsoleAdapter()
        var timerAdapter = new TimerAdapter()
        var persistenceAdapter = new PersistenceAdapter()
        var servicesProvider = new ServicesProvider()
    
        var pagerService = new PagerService(servicesProvider, epService, alertingService, consoleAdapter, persistenceAdapter, timerAdapter)
    
        const serviceID = 1
        servicesProvider.createNewService(serviceID)
        epService.addNewPolicy(serviceID, numberOfLevelsOnPolicy)
    
        // Notified level 0
        alertingService.emit("serviceDisfunction", serviceID, `Error on service ${serviceID}`)
        await wait(50)
        
        // Send signal of healty service again
        consoleAdapter.emit("healthyService", serviceID)
        await wait(50)

        timerAdapter.isSet[serviceID] = false
        timerAdapter.emit("acknowledgeTimeout", serviceID)
        await wait(50)

        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID).getLevel(0).hasNotified, "Should have notified level 0")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(1).hasNotified, "Should not have notified level 1")
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID).getLevel(2).hasNotified, "Should not have notified level 2")
        t.eq(false, timerAdapter.isSet[serviceID], "No Timer should be set")
        t.eq(true, servicesProvider.get(serviceID).isHealthy(), "Service be healthy")
    })
})

test("MULTIPLE ALERTS USE CASE", async t => {
    t.test("When there are 2 services and you receive 1 alarm for the first, and a another but for the second one. Then an acknowledge for 1, and a timeout for 2", async t => {
        var epService = new EPService()
        var alertingService = new AlertingService()
        var consoleAdapter = new ConsoleAdapter()
        var timerAdapter = new TimerAdapter()
        var persistenceAdapter = new PersistenceAdapter()
        var servicesProvider = new ServicesProvider()
    
        var pagerService = new PagerService(servicesProvider, epService, alertingService, consoleAdapter, persistenceAdapter, timerAdapter)
    
        const serviceID1 = 1
        const serviceID2 = 2
        servicesProvider.createNewService(serviceID1)
        servicesProvider.createNewService(serviceID2)
        epService.addNewPolicy(serviceID1, numberOfLevelsOnPolicy)
        epService.addNewPolicy(serviceID2, numberOfLevelsOnPolicy)
    
        // Notify service 1 level 0
        alertingService.emit("serviceDisfunction", serviceID1, `Error on service ${serviceID1}`)
        await wait(50)
        // Tests for service 1
        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID1).getLevel(0).hasNotified, "Should have notified level 0 for service " + serviceID1)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID1).getLevel(1).hasNotified, "Should not have notified level 1 for service " + serviceID1)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID1).getLevel(2).hasNotified, "Should not have notified level 2 for service " + serviceID1)
        t.eq(true, timerAdapter.isSet[serviceID1], "Timer should be set for service " + serviceID1)
        t.eq(false, servicesProvider.get(serviceID1).isHealthy(), "Service should be unhealthy for service " + serviceID1)
        
        // Tests for service 2
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID2).getLevel(0).hasNotified, "Should not have notified level 0 for service " + serviceID2)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID2).getLevel(1).hasNotified, "Should not have notified level 1 for service " + serviceID2)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID2).getLevel(2).hasNotified, "Should not have notified level 2 for service " + serviceID2)
        t.eq(undefined, timerAdapter.isSet[serviceID2], "No Timer should be set for service " + serviceID2)
        t.eq(true, servicesProvider.get(serviceID2).isHealthy(), "Service should be healthy for service " + serviceID2)
    
        // Notify service 2 level 0
        alertingService.emit("serviceDisfunction", serviceID2, `Error on service ${serviceID2}`)
        await wait(50)
        // Tests for service 1
        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID1).getLevel(0).hasNotified, "Should have notified level 0 for service " + serviceID1)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID1).getLevel(1).hasNotified, "Should not have notified level 1 for service " + serviceID1)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID1).getLevel(2).hasNotified, "Should not have notified level 2 for service " + serviceID1)
        t.eq(true, timerAdapter.isSet[serviceID1], "Timer should be set for service " + serviceID1)
        t.eq(false, servicesProvider.get(serviceID1).isHealthy(), "Service should be unhealthy for service " + serviceID1)
        
        // Tests for service 2
        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID2).getLevel(0).hasNotified, "Should have notified level 0 for service " + serviceID2)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID2).getLevel(1).hasNotified, "Should not have notified level 1 for service " + serviceID2)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID2).getLevel(2).hasNotified, "Should not have notified level 2 for service " + serviceID2)
        t.eq(true, timerAdapter.isSet[serviceID2], "Timer should be set for service " + serviceID2)
        t.eq(false, servicesProvider.get(serviceID2).isHealthy(), "Service should be unhealthy for service " + serviceID2)
    
        consoleAdapter.emit("confirmAcknowledge", serviceID1)
        timerAdapter.emit("acknowledgeTimeout", serviceID2)
        await wait(50)
        // Tests for service 1
        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID1).getLevel(0).hasNotified, "Should have notified level 0 for service " + serviceID1)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID1).getLevel(1).hasNotified, "Should not have notified level 1 for service " + serviceID1)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID1).getLevel(2).hasNotified, "Should not have notified level 2 for service " + serviceID1)
        t.eq(false, servicesProvider.get(serviceID1).isHealthy(), "Service should be unhealthy for service " + serviceID1)
        
        // Tests for service 2
        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID2).getLevel(0).hasNotified, "Should have notified level 0 for service " + serviceID2)
        t.eq(true, epService.getEscalationPolicyByServiceID(serviceID2).getLevel(1).hasNotified, "Should have notified level 1 for service " + serviceID2)
        t.eq(false, epService.getEscalationPolicyByServiceID(serviceID2).getLevel(2).hasNotified, "Should not have notified level 2 for service " + serviceID2)
        t.eq(true, timerAdapter.isSet[serviceID2], "Timer should be set for service " + serviceID2)
        t.eq(false, servicesProvider.get(serviceID2).isHealthy(), "Service should be unhealthy for service " + serviceID2)
    })
})