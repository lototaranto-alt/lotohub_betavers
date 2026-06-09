import React from 'react';
import { View } from 'react-native';

export default function ScanScreen() {
  // Questa pagina non verrà mai aperta perché il tocco è intercettato dal tabBarButton
  // in app/(tabs)/_layout.tsx, il quale apre la modale nativa sopra lo schermo attuale.
  return <View />;
}
