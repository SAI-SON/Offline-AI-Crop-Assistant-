import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { PrimaryButton } from '../components/PrimaryButton';

interface Props {
  navigation: any;
}

export const CameraScreen: React.FC<Props> = ({ navigation }) => {
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermissionAndLaunch();
  }, []);

  const checkPermissionAndLaunch = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: Strings.camera.permissionRequired,
            message: Strings.camera.permissionExplanation,
            buttonPositive: Strings.camera.grantPermission,
            buttonNegative: Strings.common.cancel,
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
          openCamera();
        } else {
          setHasPermission(false);
        }
      } catch (err) {
        setHasPermission(false);
      }
    } else {
      setHasPermission(true);
      openCamera();
    }
  };

  const openCamera = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.9,
        saveToPhotos: false,
      });

      if (result.didCancel) {
        if (!capturedUri) {
          navigation.goBack();
        }
        return;
      }

      if (result.errorCode) {
        Alert.alert('Camera Error', result.errorMessage || Strings.errors.permissionDenied);
        return;
      }

      const asset = result.assets?.[0];
      if (asset?.uri) {
        setCapturedUri(asset.uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || Strings.errors.imageProcessFailed);
    }
  };

  const handleConfirm = () => {
    if (capturedUri) {
      navigation.replace('Analysis', { imageUri: capturedUri });
    }
  };

  const handleRetake = () => {
    openCamera();
  };

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>{Strings.camera.permissionRequired}</Text>
          <Text style={styles.permissionText}>{Strings.camera.permissionExplanation}</Text>
          <PrimaryButton
            title={Strings.camera.grantPermission}
            onPress={checkPermissionAndLaunch}
            style={{ width: '100%', marginTop: 16 }}
          />
          <PrimaryButton
            title={Strings.common.back}
            variant="outline"
            onPress={() => navigation.goBack()}
            style={{ width: '100%', marginTop: 8 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {capturedUri ? (
          // Preview State
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.previewControls}>
              <Text style={styles.previewHeading}>Leaf Photo Captured</Text>
              <Text style={styles.previewSubtext}>Ensure the leaf is well-lit and in focus.</Text>

              <View style={styles.buttonRow}>
                <PrimaryButton
                  title={Strings.camera.retake}
                  icon="🔄"
                  variant="outline"
                  onPress={handleRetake}
                  style={styles.halfButton}
                />
                <PrimaryButton
                  title={Strings.camera.usePhoto}
                  icon="✓"
                  variant="primary"
                  onPress={handleConfirm}
                  style={styles.halfButton}
                />
              </View>
            </View>
          </View>
        ) : (
          // Waiting for Camera
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Opening camera...</Text>
            <PrimaryButton
              title="Launch Camera Again"
              icon="📷"
              onPress={openCamera}
              style={{ marginTop: 20 }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  permissionIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewControls: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  previewHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  previewSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  waitingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
