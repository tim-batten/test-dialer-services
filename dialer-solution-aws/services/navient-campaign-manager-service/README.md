# Schedule Service

This service pulls all schedules from the config DB and checks all schedules at a set interval. If a schedule is not running that should be, it starts executing that schedule. If a running schedule is no longer supposed to be running, it stops executing the schedule and informs the campaign manager.

# Redis

### RedisJSON

* Writes to 'campaign_execution:CAMPAIGN_EXECUTION_ID'
  * Generates the campaign execution info with data from the sequence and a snapshot of the campaign and global config at the time it was triggered
* Reads from 'schedule:SCHEDULE_ID'
  * Gets all schedules to manage
* Reads from 'global' and 'campaign:CAMPAIGN_ID'
  * Gets snapshot of global and campaign to write to the campaign_execution

### Publishes to streams

* 'campaign_control_stream'
  * Controls the campaign manager to tell it to start or stop a campaign

### Monitors streams

* 'campaign_event_stream' as 'schedule_campaign_event_group'
  * Monitors campaign events. If campaign stops will check current schedule for next sequence to execute

## Todo and missing features

* Right now the schedule service checks all schedules every second. This works well for development but is likely not sustainable once there are a large number of schedules in the database.
* The service continues to check all schedules even if their recurrence rules state that they will never execute again
* Currently this service does not remove campaign execution instances from Redis once they are complete (when a campaign execution is started a campaign_execution is added to the DB with a snapshot of relevant config)
* No pause functionality