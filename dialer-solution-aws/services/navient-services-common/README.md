# Common library

This library contains various useful utilities and data models used by every service. This includes classes and helpers for common redis use cases and transformable, validatable models for data structures used across multiple components.

## Redis

All Redis helpers and classes are in the "db" directory. Note that everything using the Redis client will do so by the RedisClientPool class (found in redis-client-pool). This is a dynamic pool of redis clients and interaction with the Redis client is exlusively done via the run method (found in utils/generic-client-pool). This run method pulls a client from the pool, executes a command then returns the client back to the pool.

This was necessary because some redis requests can block - particularly any of the group monitors.

## Models

This directory contains annotated classes that can be transformed to/from plain objects and can be validated. When using these models it is important to use their own methods for transformation - they all have toPlain() to convert to a plain object, and all have a static "from" method to convert from a plain object into an instance of the class. These methods must be used because code outside of navient-services-common does not have the necessary metadata to use the annotations and so class-transformer conversion (classToPlain + plainToClass) outside of navient-services-common will not honour the annotations.

## Todo and missing features

* Redis client pool does not currently have any kind of automated retry mechanism
* Some models are missing - notably the filter/sort and contact list