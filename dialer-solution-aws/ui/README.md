
# Navient-UI

UI For Navient Project


## Run Locally

Clone the project

```bash
  git clone git@bitbucket.org:waterfieldtech/navient-ui.git
```

Go to the project directory

```bash
  cd navient-ui
```

Install dependencies Automatically

```bash
  npm run generate-all

```
Install dependencies Manually (Recomended)

```bash
  npm install -f
  cd navient-lib
  npm install -f
  npm run build:dev
  cd ..
  cd navient-plugin
  npm install -f
  cd ..
```

Start the plugin

```bash
  npm run plugin-link
  npm start
```

Start the Web App

```bash
  npm run web-link
  npm run web-start
```
## Troubleshooting
NavientPlugin.tsx: 'SchedulerView' cannot be used as a JSX component.

Run:
```bash
  cd navient-lib
  npm install
```