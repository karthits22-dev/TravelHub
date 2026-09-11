import React, {useEffect, useRef, useState} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import socket from '../../Utils/socket';

// RN's core SafeAreaView is an iOS-only no-op on Android, which is why the
// header can end up sitting under the status bar there. This adds the
// missing top inset manually on Android.
const STATUSBAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

// ---- small helper: formats a date divider like "Today" / "Yesterday" / "12 Aug" ----
const formatDateLabel = dateInput => {
  const date = new Date(dateInput);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year:
      date.getFullYear() !== today.getFullYear()
        ? 'numeric'
        : undefined,
  });
};

// ---- small helper: initials for the avatar circle ----
const getInitials = name =>
  name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const ChatScreen = () => {
  const navigation = useNavigation();

  const currentUserId = 'userA';
  const receiverId = 'userB';
  const receiverName = 'User B';

  const roomId = [currentUserId, receiverId]
    .sort()
    .join('_');

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    console.log('Connecting socket...');

    socket.connect();

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      socket.emit('joinRoom', roomId);
      console.log('Joined room:', roomId);
    });

    socket.on('receiveMessage', data => {
      console.log('Received message:', data);
      setMessages(previousMessages => [
        ...previousMessages,
        data,
      ]);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', error => {
      console.log('Socket connection error:', error.message);
    });

    return () => {
      socket.off('connect');
      socket.off('receiveMessage');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (messages.length === 0) return;

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);
  }, [messages]);

  const sendMessage = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;
    if (!isConnected) {
      console.log('Socket is not connected');
      return;
    }

    const messageData = {
      roomId,
      senderId: currentUserId,
      receiverId,
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    console.log('Sending message:', messageData);

    socket.emit('sendMessage', messageData);
    setMessage('');
  };

  // Decide whether to show a date separator above this message
  const shouldShowDateSeparator = (item, index) => {
    if (!item.createdAt) return false;
    if (index === 0) return true;

    const prev = messages[index - 1];
    if (!prev?.createdAt) return true;

    const a = new Date(item.createdAt);
    const b = new Date(prev.createdAt);
    return (
      a.getFullYear() !== b.getFullYear() ||
      a.getMonth() !== b.getMonth() ||
      a.getDate() !== b.getDate()
    );
  };

  // Decide whether to show avatar / tighten spacing for consecutive messages
  const isGroupedWithPrevious = (item, index) => {
    if (index === 0) return false;
    const prev = messages[index - 1];
    return (
      prev.senderId === item.senderId &&
      !shouldShowDateSeparator(item, index)
    );
  };

  const renderMessage = ({item, index}) => {
    const isMyMessage = item.senderId === currentUserId;
    const grouped = isGroupedWithPrevious(item, index);

    return (
      <View>
        {shouldShowDateSeparator(item, index) && (
          <View style={styles.dateSeparatorRow}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateSeparatorText}>
              {formatDateLabel(item.createdAt)}
            </Text>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}

        <View
          style={[
            styles.messageRow,
            isMyMessage
              ? styles.myMessageRow
              : styles.otherMessageRow,
            grouped && styles.groupedRow,
          ]}>
          {!isMyMessage && (
            <View style={styles.avatarSlot}>
              {!grouped && (
                <View style={styles.avatarCircleSmall}>
                  <Text style={styles.avatarTextSmall}>
                    {getInitials(receiverName)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View
            style={[
              styles.messageBubble,
              isMyMessage
                ? styles.myMessageBubble
                : styles.otherMessageBubble,
              isMyMessage
                ? grouped && styles.myBubbleGrouped
                : grouped && styles.otherBubbleGrouped,
            ]}>
            <Text
              style={[
                styles.messageText,
                isMyMessage
                  ? styles.myMessageText
                  : styles.otherMessageText,
              ]}>
              {item.message}
            </Text>

            <Text
              style={[
                styles.timeText,
                isMyMessage
                  ? styles.myTimeText
                  : styles.otherTimeText,
              ]}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString(
                    [],
                    {hour: '2-digit', minute: '2-digit'},
                  )
                : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 0 : STATUSBAR_HEIGHT
        }>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.6}
            onPress={() => navigation.goBack()}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {getInitials(receiverName)}
            </Text>
            {isConnected && <View style={styles.onlineDot} />}
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {receiverName}
            </Text>
            <Text
              style={[
                styles.status,
                isConnected ? styles.statusOnline : styles.statusOffline,
              ]}>
              {isConnected ? 'Online' : 'Connecting…'}
            </Text>
          </View>

          <TouchableOpacity style={styles.menuButton} activeOpacity={0.6}>
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
          </TouchableOpacity>
        </View>

        {/* CHAT LIST */}
        <View style={styles.chatContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIconText}>💬</Text>
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Say hi to {receiverName} to start the conversation
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) =>
                item._id ? item._id.toString() : index.toString()
              }
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({animated: false})
              }
            />
          )}
        </View>

        {/* INPUT */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.6}>
            <Text style={styles.attachIcon}>+</Text>
          </TouchableOpacity>

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Message"
            placeholderTextColor="#9AA0A6"
            multiline
            style={styles.input}
            textAlignVertical="center"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !message.trim() && styles.disabledButton,
            ]}
            onPress={sendMessage}
            disabled={!message.trim()}
            activeOpacity={0.75}>
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
};

export default ChatScreen;

const ACCENT = '#5B6CFF';
const ACCENT_DARK = '#3D4BDB';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: STATUSBAR_HEIGHT,
  },

  container: {
    flex: 1,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F4',
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },

  backArrow: {
    fontSize: 30,
    color: '#111111',
    marginTop: -2,
  },

  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  headerTextWrap: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },

  status: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },

  statusOnline: {
    color: '#34C759',
  },

  statusOffline: {
    color: '#9AA0A6',
  },

  menuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },

  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8A8F98',
    marginVertical: 1,
  },

  /* CHAT */

  chatContainer: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  messagesContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 20,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  emptyIconText: {
    fontSize: 30,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
  },

  emptySubtitle: {
    fontSize: 13,
    color: '#9AA0A6',
    textAlign: 'center',
    lineHeight: 18,
  },

  dateSeparatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },

  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  dateSeparatorText: {
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: '600',
    color: '#9AA0A6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },

  myMessageRow: {
    justifyContent: 'flex-end',
  },

  otherMessageRow: {
    justifyContent: 'flex-start',
  },

  groupedRow: {
    marginBottom: 4,
  },

  avatarSlot: {
    width: 28,
    marginRight: 6,
  },

  avatarCircleSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarTextSmall: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  messageBubble: {
    maxWidth: '72%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },

  myMessageBubble: {
    backgroundColor: ACCENT,
    borderBottomRightRadius: 4,
  },

  myBubbleGrouped: {
    borderTopRightRadius: 18,
  },

  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },

  otherBubbleGrouped: {
    borderTopLeftRadius: 18,
  },

  messageText: {
    fontSize: 15.5,
    lineHeight: 21,
  },

  myMessageText: {
    color: '#FFFFFF',
  },

  otherMessageText: {
    color: '#1A1A1A',
  },

  timeText: {
    fontSize: 10,
    marginTop: 4,
  },

  myTimeText: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
  },

  otherTimeText: {
    color: '#B0B4BA',
  },

  /* INPUT */

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F4',
    backgroundColor: '#FFFFFF',
    marginBottom:50
  },

  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },

  attachIcon: {
    fontSize: 22,
    color: '#6B7280',
    marginTop: -2,
  },

  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 15.5,
    color: '#111111',
    backgroundColor: '#F7F8FA',
  },

  sendButton: {
    width: 40,
    height: 40,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACCENT_DARK,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },

  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
});