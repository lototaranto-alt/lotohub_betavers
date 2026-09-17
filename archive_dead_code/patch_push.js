import fs from "fs";

const layoutPath = "app/_layout.tsx";
let content = fs.readFileSync(layoutPath, "utf-8");

content = content.replace(/registerForPushNotificationsAsync\(\);/g, "// registerForPushNotificationsAsync(); // Spostato o disabilitato per evitare popup all'avvio");

fs.writeFileSync(layoutPath, content, "utf-8");
console.log("Patched _layout.tsx push notification calls");
