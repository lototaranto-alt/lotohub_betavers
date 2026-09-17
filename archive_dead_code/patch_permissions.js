import fs from "fs";

const mapPath = "app/(tabs)/map.tsx";
let mapContent = fs.readFileSync(mapPath, "utf-8");

// Remove the aggressive Location request from map.tsx
mapContent = mapContent.replace(
    /const \{ status \} = await Location\.getForegroundPermissionsAsync\(\);\s*if \(status !== 'granted'\) \{\s*const req = await Location\.requestForegroundPermissionsAsync\(\);\s*if \(req\.status === 'granted'\) setHasLocationPermission\(true\);\s*\} else \{\s*setHasLocationPermission\(true\);\s*\}/g,
    "const { status } = await Location.getForegroundPermissionsAsync();\n        if (status === 'granted') setHasLocationPermission(true);"
);
fs.writeFileSync(mapPath, mapContent, "utf-8");
console.log("Patched map.tsx");

const indexPath = "app/(tabs)/index.tsx";
let indexContent = fs.readFileSync(indexPath, "utf-8");

// Remove startBackgroundLocationUpdates on mount from index.tsx
indexContent = indexContent.replace(/await startBackgroundLocationUpdates\(\);/g, "// await startBackgroundLocationUpdates(); // Spostato al toggle manuale");
fs.writeFileSync(indexPath, indexContent, "utf-8");
console.log("Patched index.tsx");

