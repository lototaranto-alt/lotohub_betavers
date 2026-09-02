import re

with open('app/(tabs)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'const pushRotateAnim' not in content:
    content = content.replace(
        "const stepScaleAnim = useRef(new Animated.Value(1)).current;",
        "const stepScaleAnim = useRef(new Animated.Value(1)).current;\n  const pushRotateAnim = useRef(new Animated.Value(0)).current;"
    )

    old_anim = """        // Animazione "battito/spinta"
        Animated.sequence([
          Animated.timing(stepScaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
          Animated.timing(stepScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true })
        ]).start();"""
        
    new_anim = """        // Animazione Dinamica
        // 1 per le spinte (rotazione ruota), 2 per i passi (battito)
        Animated.parallel([
          Animated.sequence([
            Animated.timing(stepScaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
            Animated.timing(stepScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true })
          ]),
          Animated.sequence([
            Animated.timing(pushRotateAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(pushRotateAnim, { toValue: 0, duration: 0, useNativeDriver: true })
          ])
        ]).start();"""
    
    content = content.replace(old_anim, new_anim)
    
    # Replace the Animated.View rendering
    old_view = """<Animated.View style={{ transform: [{ scale: stepScaleAnim }] }}>"""
    new_view = """<Animated.View style={{ transform: [
                      { scale: stepScaleAnim },
                      { rotate: pushRotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }
                    ] }}>"""
    content = content.replace(old_view, new_view)

with open('app/(tabs)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Wheelchair animation added")
