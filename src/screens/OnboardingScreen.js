import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BRAND = {
  bg: '#F7F4EF',
  bgSoft: '#FCFAF7',
  white: '#FFFFFF',
  text: '#111111',
  textSoft: '#6F6B64',
  border: '#E9E2D8',
  teal: '#008C8C',
  tealSoft: 'rgba(0,140,140,0.10)',
  orange: '#F28C28',
  orangeSoft: 'rgba(242,140,40,0.12)',
};

const SLIDES = [
  {
    id: '1',
    logo: require('../assets/onboarding/logo-ikadou.png'),
    image: require('../assets/onboarding/onboarding-1.png'),
    eyebrow: 'Sécurité',
    title: 'Des biens sécurisés\net vérifiés',
    subtitle:
      'Découvrez une sélection exclusive de terrains vérifiés, présentés avec plus de clarté.',
    cta: 'Continuer',
  },
  {
    id: '2',
    logo: require('../assets/onboarding/logo-ikadou.png'),
    image: require('../assets/onboarding/onboarding-2.png'),
    eyebrow: 'Découverte',
    title: 'Le terrain idéal,\nau juste prix',
    subtitle:
      'Parcourez des annonces détaillées, filtrez facilement et trouvez plus vite la perle rare.',
    cta: 'Continuer',
  },
  {
    id: '3',
    logo: require('../assets/onboarding/logo-ikadou.png'),
    image: require('../assets/onboarding/onboarding-3.png'),
    eyebrow: 'Accompagnement',
    title: 'Votre projet\ncommence ici',
    subtitle:
      'Créez votre compte, commencez votre projet et échangez directement avec nos conseillers.',
    cta: 'Commencer',
  },
];

export default function OnboardingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  async function finish() {
    await AsyncStorage.setItem('@ikadou:onboarded', 'true');
    navigation.replace('Main');
  }

  function next() {
    if (index < SLIDES.length - 1) {
      const nextIndex = index + 1;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setIndex(nextIndex);
    } else {
      finish();
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={finish} activeOpacity={0.85} style={styles.skipBtn}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
  <Slide
    item={item}
    width={width}
    onNext={next}
    isLast={item.id === '3'}
  />
)}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.28, 1, 0.28],
              extrapolate: 'clamp',
            });

            const widthAnim = scrollX.interpolate({
              inputRange,
              outputRange: [8, 22, 8],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    opacity,
                    width: widthAnim,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Slide({ item, width, onNext, isLast }) {
  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.topBlock}>
        <Image source={item.logo} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.illustrationCard}>
        <Image source={item.image} style={styles.illustration} resizeMode="contain" />
      </View>

      <View style={styles.textBlock}>
        <View style={styles.eyebrowPill}>
          <Text style={styles.eyebrowText}>{item.eyebrow}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>

      <View style={styles.ctaWrap}>
  {isLast ? (
    <TouchableOpacity style={styles.startBtn} onPress={onNext} activeOpacity={0.9}>
      <Text style={styles.startBtnText}>Commencer</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.9}>
      <Text style={styles.nextBtnText}>Suivant</Text>
      <View style={styles.nextBtnIconWrap}>
  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
</View>
    </TouchableOpacity>
  )}
</View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },

  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 6,
  },

  skipBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  skipText: {
    color: BRAND.textSoft,
    fontSize: 13,
    fontWeight: '700',
  },

  slide: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 22,
    backgroundColor: BRAND.bg,
  },

  topBlock: {
    width: '100%',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 10,
  },

  logo: {
    width: 126,
    height: 62,
  },

  illustrationCard: {
    width: '100%',
    height: 300,
    backgroundColor: BRAND.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  illustration: {
    width: '90%',
    height: '90%',
  },

  textBlock: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  eyebrowPill: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: BRAND.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: BRAND.text,
    textAlign: 'center',
    marginBottom: 14,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: BRAND.textSoft,
    textAlign: 'center',
    maxWidth: 310,
  },

  ctaWrap: {
  width: '100%',
  marginTop: 28,
  alignItems: 'center',
  justifyContent: 'center',
},



startBtn: {
  width: '100%',
  minHeight: 52,
  borderRadius: 18,
  backgroundColor: BRAND.teal,
  alignItems: 'center',
  justifyContent: 'center',
},
nextBtn: {
  minHeight: 52,
  paddingLeft: 18,
  paddingRight: 10,
  borderRadius: 18,
  backgroundColor: BRAND.white,
  borderWidth: 1,
  borderColor: BRAND.border,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  shadowColor: '#000',
  shadowOpacity: 0.04,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
},

nextBtnText: {
  color: BRAND.text,
  fontSize: 15,
  fontWeight: '800',
},

nextBtnIconWrap: {
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: BRAND.teal,
  alignItems: 'center',
  justifyContent: 'center',
},


startBtnText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '900',
},

  footer: {
    paddingBottom: 18,
    paddingTop: 8,
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.teal,
  },
});