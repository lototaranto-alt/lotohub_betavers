import fs from "fs";

const path = "components/GamificationTransitionManager.tsx";
let content = fs.readFileSync(path, "utf-8");

if (!content.includes("useSafeAreaInsets")) {
    content = content.replace("import { View, Text, StyleSheet", "import { View, Text, StyleSheet");
    content = content.replace("from 'react-native';", "from 'react-native';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';");
    content = content.replace("const { width, height } = Dimensions.get('window');", "const { width, height } = Dimensions.get('window');");
    
    // add insets hook
    content = content.replace("const [currentIndex, setCurrentIndex] = useState(0);", "const [currentIndex, setCurrentIndex] = useState(0);\n  const insets = useSafeAreaInsets();");
    
    // modify bottom padding for whisper card
    content = content.replace("paddingTop: 40,", "paddingTop: 40,\n    paddingBottom: insets.bottom + 30, // Rispetto della Navigation Bar a 3 tasti Android");
    
    fs.writeFileSync(path, content, "utf-8");
    console.log("Patched GamificationTransitionManager for insets");
}
