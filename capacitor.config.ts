import type { CapacitorConfig } from "@capacitor/cli";

const liveReloadUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.morexapp.mobile",
  appName: "MoreXApp",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    ...(liveReloadUrl
      ? {
          url: liveReloadUrl,
          cleartext: liveReloadUrl.startsWith("http://"),
        }
      : {}),
    androidScheme: "https",
  },
};

export default config;
