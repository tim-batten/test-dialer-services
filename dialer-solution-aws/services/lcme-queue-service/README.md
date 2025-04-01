# Queue Service

The queue service monitors the queue control stream and when told to start running a queue (after the campaign manager has received notification that the cache build is complete), it will start the queue. The queue pulls pacing stats from the stats service to determine the number of records to fetch from the cache, then for each record from the cache, starts a outbound contact. When the outbound contact is completed it then loops back around to check how many records to fetch and continues until the cache service returns no records, at which point it publishes an event to the queue event stream (consumed by the campaign manager) to say that the queue is complete.

When a outbound contact starts, it adds that outbound contact to a set and when it is finished it removes it from the set in order to determine the number of active calls on a given campaign execution.

It has 2 REST endpoints:

* /eventstreams
  * Monitors event streams events to determine whether or not a call is still in flight. This is also used to populate (or partially populate) information about the outbound contact/call to feed to the redis stream consumed by lcme
* /callstatus
  * Listens for requests from the Studio Flow to fill out information missing on the event streams events such as call SID. This is specifically for failed calls.

# Redis

### RedisJSON

* Reads from 'campaign_execution:CAMPAIGN_EXECUTION_ID'
  * Gets all info about the campaign execution it's been told to action in the queue_control_stream

### Reads from hash

* Reads from 'task_queue_stats'
  * Gets the current pacing stats for task queues

### Publishes to streams

* 'call_dispositions'
  * Send events about the final status of a call for lcme to consume
* 'queue_event_stream'
  * Send events about status of the queue (e.g. queue stopped)

### Monitors streams

* 'queue_control_stream' as 'queue_control_group'
  * Controls queue stop and start

## Todo and missing features

* When fetching records from the cache, it attempts to execute them all at the same time. This could easily cause issues and outbound contact requests should be paced based on a configurable % ratio of the "Calls Per Second" on the Twilio account
* Error 429 "Too Many Requests" is not currently handled
  * If this error is detected it should affect the pacing of future requests and the outbound contact attempt should be re-added to the queue
* Currently this service requires an Event Streams sink to be manually configured on the Twilio account, however as this service already needs to be aware of its own public address (to pass to the Studio Flow for call status), it would make more sense for it to check the Event Streams API for a sink connecting to itself and, if it doesn't exist, to create one
* Currently no pause mechanism