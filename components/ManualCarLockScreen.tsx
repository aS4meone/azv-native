import React, { useState } from 'react';
import {
    Image,
    Linking,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CarModel {
  id: string;
  name: string;
  instructions: string[];
}

interface ManualCarLockScreenProps {
  onBack?: () => void;
}

export const ManualCarLockScreen: React.FC<ManualCarLockScreenProps> = ({
  onBack,
}) => {
  const [expandedModels, setExpandedModels] = useState<string[]>(['hyundai-accent']);

  const carModels: CarModel[] = [
    {
      id: 'hyundai-accent',
      name: 'Hyundai Accent',
      instructions: [
        '1. Заглушить двигатель.',
        '2. Перевести селектор АКПП в положение P.',
        '3. Открыть водительскую дверь и выйти из машины.',
        '4. Перевести флажок блокировки замка водительской двери в закрытое положение, закрыть водительскую дверь и убедиться, что замок двери заперт.',
        '5. Проделать аналогичную операцию с замками остальных дверей.',
      ],
    },
    {
      id: 'hyundai-elantra',
      name: 'Hyundai Elantra',
      instructions: [
        '1. Заглушить двигатель.',
        '2. Перевести селектор АКПП в положение P.',
        '3. Открыть водительскую дверь и выйти из машины.',
        '4. Перевести флажок блокировки замка водительской двери в закрытое положение, закрыть водительскую дверь и убедиться, что замок двери заперт.',
        '5. Проделать аналогичную операцию с замками остальных дверей.',
      ],
    },
    {
      id: 'hyundai-sonata',
      name: 'Hyundai Sonata',
      instructions: [
        '1. Заглушить двигатель.',
        '2. Перевести селектор АКПП в положение P.',
        '3. Открыть водительскую дверь и выйти из машины.',
        '4. Перевести флажок блокировки замка водительской двери в закрытое положение, закрыть водительскую дверь и убедиться, что замок двери заперт.',
        '5. Проделать аналогичную операцию с замками остальных дверей.',
      ],
    },
    {
      id: 'kia-rio-x-line',
      name: 'Kia-Rio X-Line',
      instructions: [
        '1. Заглушить двигатель.',
        '2. Перевести селектор АКПП в положение P.',
        '3. Открыть водительскую дверь и выйти из машины.',
        '4. Перевести флажок блокировки замка водительской двери в закрытое положение, закрыть водительскую дверь и убедиться, что замок двери заперт.',
        '5. Проделать аналогичную операцию с замками остальных дверей.',
      ],
    },
    {
      id: 'nissan-qashqai',
      name: 'Nissan Qashqai',
      instructions: [
        '1. Заглушить двигатель.',
        '2. Перевести селектор АКПП в положение P.',
        '3. Открыть водительскую дверь и выйти из машины.',
        '4. Перевести флажок блокировки замка водительской двери в закрытое положение, закрыть водительскую дверь и убедиться, что замок двери заперт.',
        '5. Проделать аналогичную операцию с замками остальных дверей.',
      ],
    },
    {
      id: 'omoda-c5',
      name: 'Omoda C5',
      instructions: [
        '1. Заглушить двигатель.',
        '2. Перевести селектор АКПП в положение P.',
        '3. Открыть водительскую дверь и выйти из машины.',
        '4. Перевести флажок блокировки замка водительской двери в закрытое положение, закрыть водительскую дверь и убедиться, что замок двери заперт.',
        '5. Проделать аналогичную операцию с замками остальных дверей.',
      ],
    },
    {
      id: 'toyota-camry',
      name: 'Toyota Camry',
      instructions: [
        '1. Заглушить двигатель.',
        '2. Перевести селектор АКПП в положение P.',
        '3. Открыть водительскую дверь и выйти из машины.',
        '4. Перевести флажок блокировки замка водительской двери в закрытое положение, закрыть водительскую дверь и убедиться, что замок двери заперт.',
        '5. Проделать аналогичную операцию с замками остальных дверей.',
      ],
    },
    {
      id: 'vw-polo',
      name: 'VW Polo',
      instructions: [
        '1. Заглушить двигатель.',
        '2. Перевести селектор АКПП в положение P.',
        '3. Открыть водительскую дверь и выйти из машины.',
        '4. Перевести флажок блокировки замка водительской двери в закрытое положение, закрыть водительскую дверь и убедиться, что замок двери заперт.',
        '5. Проделать аналогичную операцию с замками остальных дверей.',
      ],
    },
  ];

  const toggleModel = (modelId: string) => {
    setExpandedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleEmailSupport = () => {
    const email = 'team@azvmotors.kz';
    const subject = 'Необходима помощь с автомобилем';
    const body = 'Здравствуйте! У меня проблемы с автомобилем. Прикладываю фото салона, кузова и селфи как требуется.';
    
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(url).catch(err => console.error('Error opening email:', err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo-nbg.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Как закрыть автомобиль вручную?</Text>

        {/* Car Models List */}
        {carModels.map((model) => {
          const isExpanded = expandedModels.includes(model.id);
          
          return (
            <View key={model.id} style={styles.modelContainer}>
              <TouchableOpacity
                style={styles.modelHeader}
                onPress={() => toggleModel(model.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.modelName}>▼ {model.name}</Text>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.instructionsContainer}>
                  {model.instructions.map((instruction, index) => (
                    <Text key={index} style={styles.instructionText}>
                      {instruction}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Email Support Section */}
        <View style={styles.supportSection}>
          <View style={styles.warningContainer}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>ВАЖНО!</Text>
              <Text style={styles.supportTitle}>
                Обязательно отправьте фото салона, кузова и селфи на почту{' '}
                <Text style={styles.emailLink} onPress={handleEmailSupport}>
                  team@azvmotors.kz
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#967642',
    fontWeight: '300',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 30,
    lineHeight: 32,
  },
  modelContainer: {
    marginBottom: 10,
  },
  modelHeader: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  instructionsContainer: {
    paddingVertical: 15,
    paddingLeft: 20,
    backgroundColor: '#F8F9FA',
  },
  instructionText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 8,
  },
  supportSection: {
    marginTop: 30,
    marginBottom: 40,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 8,
  },
  supportTitle: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  emailLink: {
    color: '#967642',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default ManualCarLockScreen;
