import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  TextInput as RNTextInput, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { chatbotAPI } from '../../src/services/api';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';

const PERSONA_CONFIG = {
  strict_coach: {
    name: 'Strict Coach',
    emoji: '🏋️',
    icon: 'barbell',
    colors: ['#FF5252', '#FF6D00'],
    description: 'Tough love, no excuses',
  },
  friendly_buddy: {
    name: 'Friendly Buddy',
    emoji: '😊',
    icon: 'heart',
    colors: ['#00E676', '#00C853'],
    description: 'Your supportive best friend',
  },
  motivational: {
    name: 'Motivational Speaker',
    emoji: '🔥',
    icon: 'flame',
    colors: ['#FFB300', '#FF6D00'],
    description: 'Inspiring words that ignite passion',
  },
  scientific: {
    name: 'Science Advisor',
    emoji: '🧬',
    icon: 'flask',
    colors: ['#448AFF', '#0084FF'],
    description: 'Evidence-based guidance',
  },
};

const QUICK_PROMPTS = [
  "What should I eat before a workout?",
  "Give me a quick 15-min workout",
  "How much water should I drink?",
  "Tips to improve my sleep",
  "How to stay motivated?",
  "Best exercises for weight loss",
];

const DEFAULT_PERSONA = 'friendly_buddy';

const getValidPersona = (persona) => (
  PERSONA_CONFIG[persona] ? persona : DEFAULT_PERSONA
);

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('friendly_buddy');
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [personaRes, historyRes] = await Promise.all([
        chatbotAPI.getPersona(),
        chatbotAPI.getHistory(50),
      ]);
      setSelectedPersona(getValidPersona(personaRes?.data?.persona));
      if (historyRes.data.messages?.length > 0) {
        setMessages(Array.isArray(historyRes.data.messages) ? historyRes.data.messages : []);
      }
    } catch (e) {
      console.log('Failed to load chat data:', e);
    } finally {
      setHistoryLoaded(true);
    }
  };

  const handlePersonaChange = async (persona) => {
    const safePersona = getValidPersona(persona);
    try {
      await chatbotAPI.setPersona({ persona: safePersona });
      setSelectedPersona(safePersona);
      setShowPersonaPicker(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Error', 'Failed to change persona');
    }
  };

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotAPI.sendMessage({
        message: text,
        persona: selectedPersona,
      });

      const botMessage = {
        role: 'assistant',
        content: response.data.reply,
        persona: response.data.persona,
        timestamp: response.data.timestamp,
      };

      setMessages(prev => [...prev, botMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear all chat history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          try {
            await chatbotAPI.clearHistory();
            setMessages([]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            Alert.alert('Error', 'Failed to clear history');
          }
        },
      },
    ]);
  };

  const currentPersona = PERSONA_CONFIG[getValidPersona(selectedPersona)];

  const renderMessage = ({ item, index }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
        {!isUser && (
          <LinearGradient colors={currentPersona.colors} style={styles.avatar}>
            <Ionicons name="chatbubble-ellipses" size={14} color="#FFF" />
          </LinearGradient>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
            {item.content}
          </Text>
        </View>
        {isUser && (
          <LinearGradient colors={Colors.gradients.primary} style={styles.avatar}>
            <Ionicons name="person" size={14} color="#FFF" />
          </LinearGradient>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (!historyLoaded) return null;
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient colors={currentPersona.colors} style={styles.emptyAvatar}>
          <Ionicons name={currentPersona.icon} size={40} color="#FFF" />
        </LinearGradient>
        <Text style={styles.emptyTitle}>Hey there! {currentPersona.emoji}</Text>
        <Text style={styles.emptySubtitle}>
          I'm your {currentPersona.name.toLowerCase()}. Ask me anything about workouts, nutrition, or fitness goals!
        </Text>
        <View style={styles.quickPromptsContainer}>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => sendMessage(prompt)}
              style={styles.quickPrompt}
              activeOpacity={0.7}
            >
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderPersonaPicker = () => (
    <View style={styles.personaPickerOverlay}>
      <TouchableOpacity
        style={styles.personaPickerBackdrop}
        activeOpacity={1}
        onPress={() => setShowPersonaPicker(false)}
      />
      <View style={styles.personaPickerCard}>
        <Text style={styles.personaPickerTitle}>Choose Your Coach</Text>
        {Object.entries(PERSONA_CONFIG).map(([key, persona]) => (
          <TouchableOpacity
            key={key}
            onPress={() => handlePersonaChange(key)}
            style={[
              styles.personaOption,
              selectedPersona === key && { borderColor: persona.colors[0], backgroundColor: persona.colors[0] + '15' },
            ]}
            activeOpacity={0.7}
          >
            <LinearGradient colors={persona.colors} style={styles.personaOptionIcon}>
              <Ionicons name={persona.icon} size={20} color="#FFF" />
            </LinearGradient>
            <View style={styles.personaOptionInfo}>
              <Text style={[
                styles.personaOptionName,
                selectedPersona === key && { color: persona.colors[0] },
              ]}>
                {persona.emoji} {persona.name}
              </Text>
              <Text style={styles.personaOptionDesc}>{persona.description}</Text>
            </View>
            {selectedPersona === key && (
              <Ionicons name="checkmark-circle" size={22} color={persona.colors[0]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={currentPersona.colors} style={styles.headerIcon}>
              <Ionicons name="chatbubbles" size={18} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>Fitness Chat</Text>
              <Text style={styles.headerSubtitle}>{currentPersona.emoji} {currentPersona.name}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setShowPersonaPicker(true)}
              style={styles.headerBtn}
            >
              <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            {messages.length > 0 && (
              <TouchableOpacity onPress={clearHistory} style={styles.headerBtn}>
                <Ionicons name="trash-outline" size={22} color={Colors.accentRed} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, idx) => idx.toString()}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyContent,
          ]}
          ListEmptyComponent={renderEmpty}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing Indicator */}
        {loading && (
          <View style={styles.typingContainer}>
            <LinearGradient colors={currentPersona.colors} style={styles.typingAvatar}>
              <Ionicons name="chatbubble-ellipses" size={12} color="#FFF" />
            </LinearGradient>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.dot, { opacity: 0.4 }]} />
                <View style={[styles.dot, { opacity: 0.7 }]} />
                <View style={[styles.dot, { opacity: 1 }]} />
              </View>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <RNTextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Message your ${currentPersona.name.toLowerCase()}...`}
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={1000}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          >
            <LinearGradient
              colors={input.trim() && !loading ? Colors.gradients.primary : [Colors.surfaceLight, Colors.surfaceLight]}
              style={styles.sendBtnGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.textSecondary} />
              ) : (
                <Ionicons name="send" size={18} color={input.trim() ? '#FFF' : Colors.textTertiary} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Persona Picker Modal */}
        {showPersonaPicker && renderPersonaPicker()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerBtn: {
    padding: Spacing.sm,
  },

  // Messages
  messagesContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: Colors.surfaceLight,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: Colors.text,
  },

  // Empty / Welcome
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  quickPromptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  quickPrompt: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
  },
  quickPromptText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Typing
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  typingAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingBubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },

  // Persona Picker
  personaPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  personaPickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  personaPickerCard: {
    width: '85%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.large,
  },
  personaPickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  personaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  personaOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaOptionInfo: {
    flex: 1,
  },
  personaOptionName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  personaOptionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
