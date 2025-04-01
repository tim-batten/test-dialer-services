
# lcme-UI

UI For lcme Project


## Run Locally

Clone the project

```bash
  git clone git@bitbucket.org:waterfieldtech/lcme-ui.git
```

Go to the project directory

```bash
  cd lcme-ui
```

Install dependencies Automatically

```bash
  npm run generate-all

```
Install dependencies Manually (Recomended)

```bash
  npm install -f
  cd lcme-lib
  npm install -f
  npm run build:dev
  cd ..
  cd lcme-plugin
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
lcmePlugin.tsx: 'SchedulerView' cannot be used as a JSX component.

Run:
```bash
  cd lcme-lib
  npm install
```