import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ocrAPI } from '../api/api';

export default function ScannerScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Camera and Gallery permissions are required to scan bills.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setScannedData(null);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setScannedData(null);
    }
  };

  const extractData = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first.');
      return;
    }

    try {
      setLoading(true);

      // Create FormData
      const filename = imageUri.split('/').pop() || 'scan.jpg';
      const match = /\\.(\\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('document', {
        uri: imageUri,
        name: filename,
        type: type,
      });

      const response = await ocrAPI.scanBill(formData);
      
      if (response && response.success) {
        setScannedData(response);
        Alert.alert('Success', `Data extracted successfully!\nWallet Balance: ₹${response.newWalletBalance}`);
      } else {
        Alert.alert('Error', response.message || 'Failed to extract data.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Error', error.message || 'Something went wrong while scanning the bill.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToCreateGRN = () => {
    navigation.navigate('CreateGRN', { scannedData });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.header}>
          <Text style={styles.title}>AI Scanner</Text>
          <Text style={styles.subtitle}>Scan vendor bills to auto-extract items</Text>
        </View>

        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
            <TouchableOpacity style={styles.clearBtn} onPress={() => { setImageUri(null); setScannedData(null); }}>
              <MaterialCommunityIcons name="close-circle" size={32} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <MaterialCommunityIcons name="line-scan" size={80} color="#cbd5e1" />
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
            <MaterialCommunityIcons name="camera" size={24} color="#ffffff" />
            <Text style={styles.btnText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, styles.galleryBtn]} onPress={pickImage}>
            <MaterialCommunityIcons name="image" size={24} color="#ffffff" />
            <Text style={styles.btnText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {imageUri && !scannedData && (
          <TouchableOpacity 
            style={[styles.extractBtn, loading && styles.extractBtnDisabled]} 
            onPress={extractData}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialCommunityIcons name="auto-fix" size={24} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.extractBtnText}>Extract Data (₹5.00)</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Results Area */}
        {scannedData && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
              <Text style={styles.resultTitle}>Extraction Complete</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Supplier:</Text>
              <Text style={styles.infoValue}>{scannedData.supplierName || 'Not found'}</Text>
              
              <Text style={[styles.infoLabel, { marginTop: 12 }]}>Invoice #:</Text>
              <Text style={styles.infoValue}>{scannedData.invoiceNumber || 'Not found'}</Text>
            </View>

            <Text style={styles.itemsTitle}>Extracted Items ({scannedData.items?.length || 0})</Text>
            
            {scannedData.items?.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.itemDetailsRow}>
                  <Text style={styles.itemDetail}>Qty: {item.quantity}</Text>
                  <Text style={styles.itemDetail}>Rate: ₹{item.rate}</Text>
                  <Text style={styles.itemDetail}>GST: {item.gst}%</Text>
                </View>
                <Text style={styles.itemTotal}>Total: ₹{item.amount}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.proceedBtn} onPress={navigateToCreateGRN}>
              <Text style={styles.proceedBtnText}>Create GRN from Scan</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { padding: 24, paddingBottom: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 4 },
  
  imagePreviewContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  imagePreview: { width: '100%', height: '100%' },
  clearBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: '#ffffff', borderRadius: 16, padding: 2 },
  
  placeholderContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderText: { fontSize: 16, color: '#94a3b8', marginTop: 12, fontWeight: '500' },
  
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionBtn: { flex: 1, backgroundColor: '#0ea5e9', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  galleryBtn: { backgroundColor: '#8b5cf6', marginRight: 0, marginLeft: 8 },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  
  extractBtn: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, elevation: 4, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  extractBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0, elevation: 0 },
  extractBtnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },

  resultsContainer: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 24 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 20, fontWeight: 'bold', color: '#10b981', marginLeft: 8 },
  
  infoCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  infoLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: '700' },
  infoValue: { fontSize: 16, color: '#0f172a', fontWeight: '600', marginTop: 4 },
  
  itemsTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  itemCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 8 },
  itemDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemDetail: { fontSize: 14, color: '#64748b' },
  itemTotal: { fontSize: 16, fontWeight: '700', color: '#0ea5e9', textAlign: 'right' },

  proceedBtn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  proceedBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginRight: 8 }
});
