# lcme Dialer Backend Services

This repository contains all of the backend services for the lcme Dialer project. There are 5 main services:

* Schedule Service
* Campaign Manager
* Queue Service
* Stats Service
* Config API Service

There is also a library of common code found in lcme-services-common.

Each service has its own README with more information specific to that service.

## Build

As all of the code is in TypeScript, it needs to be transpiled to JavaScript before it can run. This repo contains the source only and so in order to run the code you will need to build it.

The same build instructions apply to each service.

1. Build lcme-services-common
2. Build the service(s)

To build any component, first go into its directory. You must first ensure that all dependencies are installed. Run `npm i`. Now go into its directory and run `npm run build`

If you're planning on making code changes and want to automatically build new files, you can also run `npm run watch`. Ensure you run this on both lcme-services-common and the service you are making changes to.

*Note: If making changes to lcme-services-common, running `npm run watch` will rebuild lcme-services-common however it will not trigger a rebuild of any services that `npm run watch` is being built against and `npm run watch` will need to be stopped and started on any services that are currently being worked on*

## Configuration

Each service is configured with .yaml config files and environment variables. By default, each service checks ../global-config/global-config.yaml and config/config.yaml, merging the two (with priority given to the local service config in case of conflicts).

For configuration options see the config.yaml.sample file in each service's config directory, and the global-config.yaml.sample file
in the global-config directory.

Some configuration can also be done in the system environment. For details on the possible options please look at the ENV_SAMPLE files in each service's config directory. Note that if using npm run dev, it will pull the env from the dev.env file in the service's config
directory. Environment variables take precedence over config files, so if the DB config is set in both the config file and the
environment, the environment variable will be used. In the case of the DB config, it is possible to partially supply it in the
config file and partially in the env (for example if you want to have the URL etc in the config file and the password in the env)

## Running

The simplest way to get any service running is to setup a dev.env file, then in the root directory of the service, run `npm run dev`

*Note: `npm run dev` runs using nodemon. This means the service will restart if a change is detected to any js file in the project (which won't change unless the code is rebuilt). If developing, it can be quite useful to run `npm run watch` and `npm run dev` simultaneously*

## Example build and run

Say you've just pulled the lcme-schedule-service and now you want to run it:

Go into lcme-schedule-service/config, copy ENV_SAMPLE to dev.env, then fill out the config. Now build and run:

```
cd lcme-services-common
npm i
npm run build
cd ../lcme-schedule-service
npm i
npm run build
npm run dev
```

## General todo and missing features

* Still using Account SID and Auth Token for all Twilio requests. This needs to be updated in the General Config schema to use an API Key and Secret and should be reflected in any components using a Twilio client
* For further todo/missing features information see each component's README file

## How to set up & run services:
1. Clone the repo: `git clone https://mepc36@bitbucket.org/waterfieldtech/lcme-services.git`.
2. Go into all service folders and install dependencies by running `npm install`.
3. Go into all service folders and compile the TypeScript into JavaScript by running `npm run build`. For hot reload watch mode, run `npm run watch` instead.
4. Copy `~/global-config/global-config.sample` to `~/global-config/global-config.yaml.`.
5. Fill out all sections marked "MANDATORY" in `global-config.yaml`.
6. Make sure your security certificate is at the `apiCertificate.certificateFilename` location listed in the global-config.yaml (which is `~/global-config.yaml`, by default.) Also double-check that `apiCertificate.certificatePassphrase` is set there also.
7. Make sure all 5 `${serviceName}appNameID` variables in global-config.yaml are configured to what the CRUD API is expecting:

```
...
configApiService:
    configApiAppNameId: 5
...
campaignManagerService:
    cacheReleaseAppNameId: 3
    cacheBuildAppNameId: 4
...
```

8. Copy `~/global-config/env.sample` to a new file, `~/global-config/dev.env`.
9. Fill out `dev.env` in case you want to override any of the settings of `global-config.yaml` (you can also just leave it blank.)
10. Run `npm run dev` inside each of the service folders.
11. To enable requests from API platforms like POSTman, set `skipAuthCheck` to true in `global-config.yaml`.
12. Make sure all optinoal dev flags, like `skipAuthCheck` and `skipFlowExecution` and `destinationPhoneNumber`, are turned off by having `false` or `undefined` values.