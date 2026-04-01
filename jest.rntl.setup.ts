import { jest } from '@jest/globals';
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  return require('react-native-reanimated/mock');
});
