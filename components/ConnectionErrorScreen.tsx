import React from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ConnectionErrorScreenProps {
  onTryAgain?: () => void;
  onManualInstructions?: () => void;
  isRetrying?: boolean;
}

export const ConnectionErrorScreen: React.FC<ConnectionErrorScreenProps> = ({
  onTryAgain,
  onManualInstructions,
  isRetrying = false,
}) => {
  const handlePhoneCall = () => {
    Linking.openURL('tel:+77000250400');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      
      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo-nbg.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Error Section */}
        <View style={styles.errorSection}>
          <Text style={styles.errorTitle}>Ошибка:</Text>
          <Text style={styles.errorMessage}>не удалось получить данные.</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onManualInstructions}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Как закрыть авто вручную</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePhoneCall}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Позвонить в поддержку</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Try Again Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.tryAgainButton, isRetrying && styles.tryAgainButtonDisabled]}
            onPress={isRetrying ? undefined : onTryAgain}
            activeOpacity={isRetrying ? 1 : 0.8}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingIndicator} />
                <Text style={styles.tryAgainButtonText}>Проверка соединения...</Text>
              </View>
            ) : (
              <Text style={styles.tryAgainButtonText}>Попробовать снова</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#000000',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  errorSection: {
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  menuItemText: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#967642',
    fontWeight: '300',
  },
  buttonContainer: {
    paddingBottom: 20,
    paddingTop: 20,
  },
  tryAgainButton: {
    backgroundColor: '#967642',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 0,
  },
  tryAgainButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  tryAgainButtonDisabled: {
    backgroundColor: '#B8906B',
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
});

export default ConnectionErrorScreen;
