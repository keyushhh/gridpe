import { NativeBiometric } from 'capacitor-native-biometric';

export const BIOMETRIC_SERVER = 'gridpe-auth';

interface BiometricAvailability {
  isAvailable: boolean;
  hasBiometrics: boolean;
}

export const BiometricService = {
  /**
   * Checks if biometric authentication is available on the device
   */
  async checkAvailability(): Promise<BiometricAvailability> {
    try {
      const result = await NativeBiometric.isAvailable();
      return {
        isAvailable: result.isAvailable,
        hasBiometrics: !!result.biometryType
      };
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return { isAvailable: false, hasBiometrics: false };
    }
  },

  /**
   * Prompts the user for biometric authentication
   */
  async verifyIdentity(reason: string = 'Authenticate to continue'): Promise<boolean> {
    try {
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'Biometric Unlock',
        subtitle: 'Identification required',
        description: 'Please scan your face or fingerprint to continue.',
      });
      return true;
    } catch (error) {
      console.error('Biometric verification failed:', error);
      return false;
    }
  },

  /**
   * Securely saves the MPIN to the device Keychain/Keystore
   */
  async saveMpin(userId: string, mpin: string): Promise<boolean> {
    try {
      await NativeBiometric.setCredentials({
        username: userId,
        password: mpin,
        server: BIOMETRIC_SERVER,
      });
      return true;
    } catch (error) {
      console.error('Failed to save MPIN to vault:', error);
      return false;
    }
  },

  /**
   * Retrieves the stored MPIN from the device vault
   */
  async getStoredMpin(): Promise<string | null> {
    try {
      const result = await NativeBiometric.getCredentials({
        server: BIOMETRIC_SERVER,
      });
      return result.password || null;
    } catch (error) {
      console.warn('No stored MPIN found or retrieval failed:', error);
      return null;
    }
  },

  /**
   * Deletes the stored MPIN from the device vault
   */
  async deleteStoredMpin(): Promise<void> {
    try {
      await NativeBiometric.deleteCredentials({
        server: BIOMETRIC_SERVER,
      });
    } catch (error) {
      console.error('Failed to delete stored MPIN:', error);
    }
  }
};
