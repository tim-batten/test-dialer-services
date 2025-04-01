# Config API service

This service provides REST endpoints for the UIs to use to configure the dialer solution. There are currently quite a few gaps in this service as development has primarily been focused on the other services.

## Todo and missing features

* Filter/Sort config is not implemented
  * Note: This should be mocked up initially but will need to be connected to Navient's filter/sort API
* Contact list config is not implemented
* Some schemas are out of date and do not relfect the latest config
* This service will likely ultimately provide do more than just configuration such as providing an interface to pull current campaign stats etc. These need to be developed and the service should probably be renamed to reflect that.
* There is currently no authentication, concept of or conformity to user roles

