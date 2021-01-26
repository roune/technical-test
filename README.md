# Technical Test

This test has been developed with the following tools, which are also necessary for the execution:

* NodeJS: 15.5.1
* NPM: 7.3.0

Although I suspect it would work with lower versions, these and superior would make the tests run perfectly.

## Database

This design is intended for a stateless app. This is why, it would be necessary an ACID database, preferibly allocated on the cloud. For simplicity, I organized the information in JSON format, which is also the one used on NoSQL like MongoDB.
It is not necessary and specific SQL or NoSQL database for the microservice.

## Execution Of Tests

There are needed only two commands to run the tests:

* npm install
* npm test

## Design

Although I would develop the Pager Service in a different way, I implemented it as a process in a (for example) docker. This process is waiting for the drivers of the adapters to send the "events" expected in the design of the system.
I feel, an implementation via (AWS|Azure) Functions, would be a better fit for this solution, because there would be no charges and no computation needed until some service errors. The methods of the class PagerService would be almost the same, but the constructor would change.