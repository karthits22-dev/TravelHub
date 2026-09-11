import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
// RN's built-in SafeAreaView is a no-op on Android; this one actually
// measures real insets on both platforms (required now that Android 15+
// enforces edge-to-edge for all screens, not just ones that opt in).
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {searchPlaces, getPlaceDetails, newSessionToken} from '../../Services/PlacesService';
import {
  getRecentLocations,
  addRecentLocation,
  getFavoriteLocations,
  setFavoriteLocation,
} from '../../Services/RecentLocationsService';

const BLUE = '#0057FF';
const INK = '#111827';
const GRAY = '#6B7280';

const DEBOUNCE_MS = 300;

const PlaceSearchModal = ({
  visible,
  title,
  fieldColor,
  biasLocation,
  onClose,
  onSelect,
  onUseCurrentLocation,
}) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [favorites, setFavorites] = useState({home: null, work: null});
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const sessionTokenRef = useRef(newSessionToken());
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setPredictions([]);
    sessionTokenRef.current = newSessionToken();
    getRecentLocations().then(setRecent);
    getFavoriteLocations().then(setFavorites);
  }, [visible]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setPredictions([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(query, sessionTokenRef.current, biasLocation);
      setPredictions(results);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [query, biasLocation]);

  const commitSelection = useCallback(
    async place => {
      const updatedRecent = await addRecentLocation(place);
      setRecent(updatedRecent);
      sessionTokenRef.current = newSessionToken();
      onSelect(place);
    },
    [onSelect],
  );

  const handlePickPrediction = useCallback(
    async prediction => {
      setLoading(true);
      const details = await getPlaceDetails(prediction.placeId, sessionTokenRef.current);
      setLoading(false);
      if (!details) {
        Alert.alert('Unavailable', 'Could not load that location. Please try another.');
        return;
      }
      commitSelection({
        placeId: prediction.placeId,
        description: prediction.description,
        address: details.address,
        latitude: details.latitude,
        longitude: details.longitude,
      });
    },
    [commitSelection],
  );

  const handleUseCurrentLocation = useCallback(async () => {
    if (!onUseCurrentLocation) return;
    setLocating(true);
    try {
      const place = await onUseCurrentLocation();
      if (place) await commitSelection(place);
    } catch (err) {
      Alert.alert('Location unavailable', err?.message ?? 'Could not get your current location.');
    } finally {
      setLocating(false);
    }
  }, [onUseCurrentLocation, commitSelection]);

  const handleSaveFavorite = useCallback(place => {
    const save = async kind => {
      const updated = await setFavoriteLocation(kind, place);
      setFavorites(updated);
    };
    Alert.alert('Save location', `Save "${place.description ?? place.address}" as:`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Home', onPress: () => save('home')},
      {text: 'Work', onPress: () => save('work')},
    ]);
  }, []);

  const handleRemoveFavorite = useCallback(kind => {
    Alert.alert('Remove favorite', `Remove your saved ${kind === 'home' ? 'Home' : 'Work'} location?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = await setFavoriteLocation(kind, null);
          setFavorites(updated);
        },
      },
    ]);
  }, []);

  const renderPrediction = useCallback(
    ({item}) => (
      <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => handlePickPrediction(item)}>
        <View style={styles.rowIconBadge}>
          <Icon name="location" size={15} color={GRAY} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowPrimary} numberOfLines={1}>
            {item.primaryText}
          </Text>
          {!!item.secondaryText && (
            <Text style={styles.rowSecondary} numberOfLines={1}>
              {item.secondaryText}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [handlePickPrediction],
  );

  const renderRecent = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => commitSelection(item)}
        onLongPress={() => handleSaveFavorite(item)}>
        <View style={styles.rowIconBadge}>
          <Icon name="time" size={15} color={GRAY} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowPrimary} numberOfLines={1}>
            {item.description ?? item.address}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [commitSelection, handleSaveFavorite],
  );

  const showingPredictions = query.trim().length >= 2;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
            <Icon name="arrow-back" size={20} color={INK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.searchBar}>
          <View style={[styles.dot, {backgroundColor: fieldColor}]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for area, street, landmark..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          {loading && <ActivityIndicator size="small" color={BLUE} />}
        </View>

        {!showingPredictions && (
          <View style={styles.quickAccessCard}>
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={handleUseCurrentLocation}
              disabled={locating}>
              <View style={[styles.rowIconBadge, styles.rowIconBadgeAccent]}>
                {locating ? (
                  <ActivityIndicator size="small" color={BLUE} />
                ) : (
                  <Icon name="navigate" size={15} color={BLUE} />
                )}
              </View>
              <Text style={styles.currentLocationText}>
                {locating ? 'Locating…' : 'Use current location'}
              </Text>
            </TouchableOpacity>

            {['home', 'work'].map(kind => {
              const fav = favorites[kind];
              return (
                <TouchableOpacity
                  key={kind}
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => (fav ? commitSelection(fav) : null)}
                  onLongPress={() => fav && handleRemoveFavorite(kind)}>
                  <View style={styles.rowIconBadge}>
                    <Icon
                      name={kind === 'home' ? 'home' : 'briefcase'}
                      size={15}
                      color={fav ? BLUE : GRAY}
                    />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowPrimary} numberOfLines={1}>
                      {kind === 'home' ? 'Home' : 'Work'}
                    </Text>
                    <Text style={styles.rowSecondary} numberOfLines={1}>
                      {fav ? fav.description ?? fav.address : `Tap to set your ${kind === 'home' ? 'home' : 'work'} address`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {showingPredictions ? (
          <FlatList
            data={predictions}
            keyExtractor={item => item.placeId}
            renderItem={renderPrediction}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.emptyText}>No matches found.</Text>
              ) : null
            }
          />
        ) : (
          <FlatList
            data={recent}
            keyExtractor={(item, idx) => item.placeId ?? `recent-${idx}`}
            renderItem={renderRecent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              recent.length ? <Text style={styles.sectionLabel}>Recent</Text> : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: INK,
    padding: 0,
  },
  quickAccessCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: GRAY,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  rowIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconBadgeAccent: {
    backgroundColor: '#EAF2FF',
  },
  rowText: {
    flex: 1,
  },
  rowPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: INK,
  },
  rowSecondary: {
    fontSize: 12,
    color: GRAY,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: GRAY,
    fontSize: 13,
    marginTop: 24,
  },
});

export default PlaceSearchModal;
