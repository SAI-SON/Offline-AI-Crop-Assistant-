import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';

import { HomeScreen } from '../screens/HomeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { DiseaseDetailsScreen } from '../screens/DiseaseDetailsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { DiagnosticsScreen } from '../screens/DiagnosticsScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { CropAnalysisScreen } from '../screens/CropAnalysisScreen';
import { CropAnalysisInputScreen } from '../screens/CropAnalysisInputScreen';
import { CropAnalysisResultScreen } from '../screens/CropAnalysisResultScreen';
import { CropAnalysisHistoryScreen } from '../screens/CropAnalysisHistoryScreen';
import { CropRecommendationInputScreen } from '../screens/CropRecommendationInputScreen';
import { CropRecommendationResultScreen } from '../screens/CropRecommendationResultScreen';
import {
  CropRequirement,
  UserCropInput,
  CropAnalysisResult,
  CropRecommendationItem,
} from '../types/cropAnalysis';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Analysis: { imageUri: string };
  Result: { imageUri: string; inferenceResult: any; diseaseInfo?: any; fullDiseaseData?: any };
  History: undefined;
  DiseaseDetails: { label?: string } | undefined;
  Settings: undefined;
  Diagnostics: undefined;
  About: undefined;
  CropAnalysis: undefined;
  CropAnalysisInput: { cropId: number; cropName: string; crop: CropRequirement };
  CropAnalysisResult: { crop: CropRequirement; userInput: UserCropInput; result: CropAnalysisResult };
  CropAnalysisHistory: undefined;
  CropRecommendationInput: undefined;
  CropRecommendationResult: { userInput: UserCropInput; recommendations: CropRecommendationItem[] };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primaryDark,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            title: 'Scan Leaf',
            headerStyle: { backgroundColor: '#121212' },
          }}
        />
        <Stack.Screen
          name="Analysis"
          component={AnalysisScreen}
          options={{
            title: 'Analyzing Leaf',
            headerStyle: { backgroundColor: '#0E1A11' },
          }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            title: 'Diagnosis Result',
          }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'Scan History',
          }}
        />
        <Stack.Screen
          name="DiseaseDetails"
          component={DiseaseDetailsScreen}
          options={{
            title: 'Disease Library',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings & Storage',
          }}
        />
        <Stack.Screen
          name="Diagnostics"
          component={DiagnosticsScreen}
          options={{
            title: 'Model Diagnostics',
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            title: 'About CropCare AI',
          }}
        />
        <Stack.Screen
          name="CropAnalysis"
          component={CropAnalysisScreen}
          options={{
            title: 'Crop Suitability Analysis',
          }}
        />
        <Stack.Screen
          name="CropAnalysisInput"
          component={CropAnalysisInputScreen}
          options={{
            title: 'Soil & Climate Inputs',
          }}
        />
        <Stack.Screen
          name="CropAnalysisResult"
          component={CropAnalysisResultScreen}
          options={{
            title: 'Crop Suitability Report',
          }}
        />
        <Stack.Screen
          name="CropAnalysisHistory"
          component={CropAnalysisHistoryScreen}
          options={{
            title: 'Crop Analysis History',
          }}
        />
        <Stack.Screen
          name="CropRecommendationInput"
          component={CropRecommendationInputScreen}
          options={{
            title: 'Crop Recommendation',
          }}
        />
        <Stack.Screen
          name="CropRecommendationResult"
          component={CropRecommendationResultScreen}
          options={{
            title: 'Recommended Crops',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
