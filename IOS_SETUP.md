# Vitalyx iOS setup

This project now uses Capacitor so the shared React web app can be packaged as an iOS app.

## Local flow

1. Run `npm install`
2. Run `npm run mobile:build`
3. Run `npm run mobile:sync:ios`

## Live preview on device

`localhost` will not work from an iPhone or iOS simulator unless the server is running on that same machine. For a live preview from your Windows dev box:

1. Start the web app on your local network with `npm run web:dev:network`
2. Find your computer's LAN IP, for example `192.168.1.25`
3. Sync the iOS app with that address:
   `set CAP_SERVER_URL=http://192.168.1.25:5173 && npm run mobile:sync:ios`
4. Open the iOS project on macOS with Xcode and run it on the simulator or device

If you use a different port, update the URL to match. When you are done with live preview, clear `CAP_SERVER_URL` or run the normal `npm run mobile:build` and `npm run mobile:sync:ios` flow again to go back to bundled assets.

## Native iOS finish

The iOS project must be opened on macOS with Xcode.

1. Move the repo to a Mac.
2. Run `npm install`
3. Run `npm run mobile:build`
4. Run `npm run mobile:sync:ios`
5. Run `npm run mobile:open:ios`
6. In Xcode, choose a signing team, simulator, or connected device, then build/archive.

## Notes

- Windows can prepare the shared web app and Capacitor config, but it cannot produce a signed `.ipa`.
- If you want push notifications, camera, or native health integrations next, those can be added as Capacitor plugins.
