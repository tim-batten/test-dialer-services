# Stats Service

This service periodically checks the TaskRouter API for stats that are used by the Queue Service for pacing calculations. It will only monitor the relevant TaskQueues on active campaigns (by monitoring the campaign event stream) and will distribute its requests within the polling timeframe. For example, if two active campaigns A and B are running and the polling period is set to 5 seconds, it will check A at 0 seconds, B at 2.5 seconds, A at 5 seconds etc.

## Redis interactions

### Writes to hash

* 'task_queue_stats:TASK_QUEUE_SID'
  * Writes pacing stats

### RedisJSON

* Reads from 'campaign_execution:CAMPAIGN_EXECUTION_ID'
  * Gets the TaskQueue info from active campaigns

### Monitors streams

* 'campaign_event_stream' as 'stats_campaign_event_group'
  * Monitors campaign events to determine which TaskQueues to monitor

## Todo and missing features
