class PersistenceAdapter {
    constructor() {
        this.docs = {}
    }

    getDisfunction({serviceID}) {
        return this.docs[serviceID]
    }

    insertOrUpdateDisfunction(doc) {
        this.docs[doc.serviceID] = !this.docs[doc.serviceID] ? doc : {...this.docs[doc.serviceID], ...doc}
    }

    confirmAcknowledge({serviceID, acknowledge}) {
        if (!this.docs[serviceID]) { return }
        this.docs[serviceID].acknowledge = acknowledge
    }
}

module.exports = {PersistenceAdapter}