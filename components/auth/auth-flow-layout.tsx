import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  children: ReactNode;
  subtitle: string;
};

export function AuthFlowLayout({ children, subtitle }: Props) {
  const bg = useThemeColor({}, 'background');
  const muted = useThemeColor({}, 'mutedForeground');
  const text = useThemeColor({}, 'text');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['bottom']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={[styles.brand, { color: text }]}>
            RunTogether
          </ThemedText>
          <ThemedText style={[styles.introSub, { color: muted }]}>{subtitle}</ThemedText>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 40,
  },
  intro: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  introSub: {
    fontSize: 15,
    lineHeight: 21,
  },
});
