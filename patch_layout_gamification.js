import fs from "fs";

const layoutPath = "app/_layout.tsx";
let content = fs.readFileSync(layoutPath, "utf-8");

const importStmt = "import { GamificationProvider } from '../context/GamificationContext';\n";
if (!content.includes(importStmt)) {
    content = content.replace("import { ThemeProvider } from '../context/ThemeContext';", "import { ThemeProvider } from '../context/ThemeContext';\n" + importStmt);
}

// Wrap <MobilityProvider> inside <GamificationProvider> or just inside <ThemeProvider>
if (!content.includes("<GamificationProvider>")) {
    content = content.replace("<MobilityProvider>", "<GamificationProvider>\n            <MobilityProvider>");
    content = content.replace("</MobilityProvider>", "</MobilityProvider>\n            </GamificationProvider>");
    fs.writeFileSync(layoutPath, content, "utf-8");
    console.log("Patched _layout.tsx");
}
