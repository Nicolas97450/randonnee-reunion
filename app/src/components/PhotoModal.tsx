import React from 'react';
import { StyleSheet, Modal, View, Pressable, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@/constants';
import type { TrailPhoto } from '@/hooks/useTrailPhotos';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PhotoModalProps {
  selectedPhoto: TrailPhoto | null;
  onClose: () => void;
}

export default function PhotoModal({ selectedPhoto, onClose }: PhotoModalProps) {
  return (
    <Modal
      visible={selectedPhoto !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.photoModalOverlay}>
        <Pressable
          style={styles.photoModalClose}
          onPress={onClose}
          accessibilityLabel="Fermer la photo"
        >
          <Ionicons name="close" size={28} color={COLORS.white} />
        </Pressable>
        {selectedPhoto && (
          <Image
            source={{ uri: selectedPhoto.url }}
            style={styles.photoModalImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  photoModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayHeavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: SPACING.xxl,
    right: SPACING.md,
    zIndex: 10,
    width: SPACING.xxl,
    height: SPACING.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
});
