import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
// RN's built-in SafeAreaView is a no-op on Android; this one actually
// measures real insets on both platforms (required now that Android 15+
// enforces edge-to-edge for all screens, not just ones that opt in).
import {SafeAreaView} from 'react-native-safe-area-context';
import Video from 'react-native-video';

const VIDEO_WIDTH = 256;
const VIDEO_HEIGHT = 160;

const SplashScreen = ({navigation}) => {
    const HandleLoginpage=()=>{
        navigation.navigate("Login")
    }
  return (
    <View style={styles.screen}>
      {/* Background decoration */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />
      <View style={styles.circleAccent} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Top image area */}
        <SafeAreaView style={styles.imageArea}>
          <View style={styles.imageWrapper}>
            {/* <View style={styles.imageCard}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=600&fit=crop&auto=format',
                }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
            </View> */}

            {/* Floating cards */}
            {/* <View style={[styles.floatingCard, styles.taxiCard]}>
              <Text style={styles.cardEmoji}>🚖</Text>
              <View>
                <Text style={styles.cardTitle}>Taxi Nearby</Text>
                <Text style={styles.cardSubtitleGreen}>3 min away</Text>
              </View>
            </View>

            <View style={[styles.floatingCard, styles.hotelCard]}>
              <Text style={styles.cardEmoji}>🏨</Text>
              <View>
                <Text style={styles.cardTitle}>Hotels</Text>
                <Text style={styles.cardSubtitleAmber}>Best Deals</Text>
              </View>
            </View> */}
          </View>

          {/* Car animation */}
          <View style={styles.videoCard}>
            <Video
              source={require('../assets/videos/camper-van.mp4')}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              repeat
              muted
              playInBackground={false}
              playWhenInactive={false}
            />
          </View>
        </SafeAreaView>

        {/* Bottom sheet */}
        <View style={styles.bottomSheet}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>T</Text>
            </View>
            <Text style={styles.brandName}>TravelHub</Text>
          </View>

          <Text style={styles.headline}>
            One App.{'\n'}Every Journey.{'\n'}Every Booking.
          </Text>

          <Text style={styles.subheadline}>
            Book taxis, hotels, homestays, travel insurance, and transport
            services — all in one place.
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={HandleLoginpage}
              activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={HandleLoginpage}
              activeOpacity={0.85}>
              <Text style={styles.secondaryButtonText}>Login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const BLUE = '#0057FF';
const BLUE_DARK = '#0040CC';
const AMBER = '#F59E0B';
const GREEN = '#16A34A';
const INK = '#111827';
const GRAY = '#6B7280';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BLUE,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
  },
  circleTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: 160,
    left: -40,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circleAccent: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    marginLeft: -64,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(245,158,11,0.2)',
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  imageWrapper: {
    position: 'relative',
  },
  imageCard: {
    width: 256,
    height: 256,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,87,255,0.25)',
  },
  floatingCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  taxiCard: {
    bottom: -16,
    left: -32,
  },
  hotelCard: {
    top: -16,
    right: -32,
  },
  videoCard: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    marginTop: 28,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: INK,
  },
  cardSubtitleGreen: {
    fontSize: 12,
    fontWeight: '500',
    color: GREEN,
  },
  cardSubtitleAmber: {
    fontSize: 12,
    fontWeight: '500',
    color: AMBER,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  brandName: {
    color: BLUE,
    fontWeight: 'bold',
    fontSize: 18,
  },
  headline: {
    fontSize: 26,
    fontWeight: 'bold',
    color: INK,
    lineHeight: 32,
    marginBottom: 12,
  },
  subheadline: {
    color: GRAY,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: BLUE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: BLUE_DARK,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 2,
    borderColor: BLUE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: BLUE,
    fontWeight: '600',
    fontSize: 16,
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: GRAY,
    marginTop: 15,
    marginBottom:20
  },
  termsLink: {
    color: BLUE,
    fontWeight: '500',
  },
});

export default SplashScreen;