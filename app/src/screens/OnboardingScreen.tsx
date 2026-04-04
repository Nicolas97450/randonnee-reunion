import { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Dimensions,
  type ViewToken,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, ELEVATION } from '@/constants';
import { hapticLight, hapticSuccess } from '@/lib/haptics';

const { width } = Dimensions.get('window');

const USER_LEVEL_KEY = '@rando_user_level';

export type UserLevel = 'debutant' | 'confirme' | 'expert';

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'map',
    iconColor: COLORS.primaryLight,
    title: 'Explore La Reunion',
    subtitle:
      '710 sentiers avec carte interactive, meteo montagne, etat ONF en temps reel et points d\'interet. Lance une rando libre n\'importe ou.',
  },
  {
    id: '2',
    icon: 'navigate',
    iconColor: COLORS.info,
    title: 'Ton GPS de montagne',
    subtitle:
      'Tracking GPS precis, guidage vocal en francais, alerte hors-sentier, boussole et bouton SOS 112. Meme hors connexion.',
  },
  {
    id: '3',
    icon: 'trophy',
    iconColor: COLORS.warning,
    title: 'Defie l\'ile entiere',
    subtitle:
      'Decouvre le fog of war, debloque 18 badges, grimpe dans le leaderboard, complete les 8 defis thematiques. Chaque rando compte.',
  },
  {
    id: '4',
    icon: 'people',
    iconColor: COLORS.primaryLight,
    title: 'Quel randonneur es-tu ?',
    subtitle:
      'Choisis ton niveau pour des suggestions personnalisees. Retrouve tes amis, organise des sorties et partage tes aventures.',
  },
];

const LEVEL_OPTIONS: Array<{
  level: UserLevel;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  {
    level: 'debutant',
    label: 'Debutant',
    description: 'Sentiers courts et faciles',
    icon: 'leaf',
    color: COLORS.easy,
  },
  {
    level: 'confirme',
    label: 'Confirme',
    description: 'Randos moyennes, bon rythme',
    icon: 'trending-up',
    color: COLORS.medium,
  },
  {
    level: 'expert',
    label: 'Expert',
    description: 'Sentiers techniques et longs',
    icon: 'flash',
    color: COLORS.expert,
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<UserLevel | null>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const isQuizSlide = currentIndex === SLIDES.length - 1;
  const isPreQuizLast = currentIndex === SLIDES.length - 2;

  const handleSelectLevel = useCallback(async (level: UserLevel) => {
    hapticSuccess();
    setSelectedLevel(level);
    try {
      await AsyncStorage.setItem(USER_LEVEL_KEY, level);
    } catch {
      // Silently fail — level will default
    }
    // Small delay for feedback before transition
    setTimeout(onComplete, 300);
  }, [onComplete]);

  const handleNext = () => {
    hapticLight();
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    if (item.id === '4') {
      return (
        <View style={styles.slide}>
          <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '15' }]}>
            <Ionicons name={item.icon} size={80} color={item.iconColor} />
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <View style={styles.levelOptions}>
            {LEVEL_OPTIONS.map((option) => (
              <Pressable
                key={option.level}
                style={[
                  styles.levelButton,
                  selectedLevel === option.level && styles.levelButtonSelected,
                  { borderColor: option.color },
                ]}
                onPress={() => handleSelectLevel(option.level)}
                accessibilityLabel={`Niveau ${option.label} : ${option.description}`}
                accessibilityRole="button"
              >
                <Ionicons name={option.icon} size={24} color={option.color} />
                <View style={styles.levelTextContainer}>
                  <Text style={[styles.levelLabel, { color: option.color }]}>
                    {option.label}
                  </Text>
                  <Text style={styles.levelDescription}>{option.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.slide}>
        <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '15' }]}>
          <Ionicons name={item.icon} size={80} color={item.iconColor} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip — hidden on quiz slide */}
      {!isQuizSlide && (
        <Pressable style={styles.skipButton} onPress={onComplete} accessibilityLabel="Passer l'introduction">
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEnabled={!isQuizSlide}
      />

      {/* Dots + Button — hide next button on quiz slide */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        {!isQuizSlide && (
          <Pressable
            style={styles.nextButton}
            onPress={handleNext}
            accessibilityLabel={isPreQuizLast ? 'Choisir mon niveau' : 'Voir la diapositive suivante'}
          >
            <Text style={styles.nextText}>Suivant</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    zIndex: 10,
    minWidth: SPACING.xxl,
    minHeight: SPACING.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    minHeight: SPACING.xxl,
    ...ELEVATION.raised,
  },
  nextText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  levelOptions: {
    width: '100%',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  levelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
    ...ELEVATION.raised,
  },
  levelButtonSelected: {
    backgroundColor: COLORS.surfaceLight,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  levelDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
