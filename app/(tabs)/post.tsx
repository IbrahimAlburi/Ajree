import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PostScreen() {
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const inputBg = useThemeColor({}, 'inputBackground');
  const muted = useThemeColor({}, 'mutedForeground');
  const mutedBg = useThemeColor({}, 'muted');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const primaryText = useThemeColor({}, 'primaryButtonText');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
        <ThemedText type="subtitle">New Activity</ThemedText>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.mapPlaceholder, { backgroundColor: mutedBg }]}>
          <ThemedText style={styles.mapEmoji}>📍</ThemedText>
          <ThemedText style={[styles.mapHint, { color: muted }]}>
            Upload route map or start recording
          </ThemedText>
        </View>

        <TextInput
          placeholder="Title (optional)"
          placeholderTextColor={muted}
          style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
        />

        <View style={styles.row3}>
          <TextInput
            placeholder="Distance (km)"
            placeholderTextColor={muted}
            keyboardType="decimal-pad"
            style={[styles.inputSmall, { backgroundColor: inputBg, color: text, borderColor: border }]}
          />
          <TextInput
            placeholder="Duration"
            placeholderTextColor={muted}
            style={[styles.inputSmall, { backgroundColor: inputBg, color: text, borderColor: border }]}
          />
          <TextInput
            placeholder="Pace"
            placeholderTextColor={muted}
            style={[styles.inputSmall, { backgroundColor: inputBg, color: text, borderColor: border }]}
          />
        </View>

        <TextInput
          placeholder="How was your run?"
          placeholderTextColor={muted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: inputBg, color: text, borderColor: border }]}
        />

        <Pressable
          style={[styles.shareBtn, { backgroundColor: tint }]}
          accessibilityRole="button"
          accessibilityLabel="Share activity">
          <ThemedText style={[styles.shareBtnText, { color: primaryText }]}>Share Activity</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  mapPlaceholder: {
    height: 220,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapEmoji: {
    fontSize: 40,
  },
  mapHint: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  row3: {
    flexDirection: 'row',
    gap: 8,
  },
  inputSmall: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 13,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  shareBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  shareBtnText: {
    fontWeight: '600',
    fontSize: 17,
  },
});
