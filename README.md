# Geodev

Made with [Svelte](https://svelte.dev).

_Note that you will need to have [Node.js](https://nodejs.org) installed._

## Get started

Install the dependencies...

```bash
cd geodev
npm install
```

...then start [Rollup](https://rollupjs.org) and the [firebase emulator](https://firebase.google.com/docs/emulator-suite):

```bash
firebase emulators:start --only database & npm run dev && fg
```

Navigate to [localhost:8080](http://localhost:8080). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

If you're using [Visual Studio Code](https://code.visualstudio.com/) svelte recommends installing the official extension [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode). If you are using other editors you may need to install a plugin in order to get syntax highlighting and intellisense.

To debug the local database, head to [localhost:8085](http://localhost:8085/database/geoclash-3ed30-default-rtdb/data).

## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```

You can run the newly built app with `npm run start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).
