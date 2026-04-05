import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("moreXApp", {
  environment: "desktop",
});

declare global {
  interface Window {
    moreXApp?: {
      environment: "desktop";
    };
  }
}
