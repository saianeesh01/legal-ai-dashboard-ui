import * as CryptoJS from 'crypto-js';
import { randomBytes } from 'crypto';

/**
 * Document Encryption Service
 * Provides AES-256 encryption for document content with secure key management
 */
export class DocumentEncryption {
  private static readonly ALGORITHM = 'AES';
  private static readonly KEY_SIZE = 256;
  private static readonly IV_SIZE = 16; // 128 bits
  
  /**
   * Generate a secure encryption key for the session
   * In production, this should be stored securely (e.g., environment variable, key vault)
   */
  private static getEncryptionKey(): string {
    // Use environment variable or generate a secure key
    if (process.env.DOCUMENT_ENCRYPTION_KEY) {
      return process.env.DOCUMENT_ENCRYPTION_KEY;
    }
    
    // Fallback: generate a key (should be stored persistently in production)
    console.warn('Using generated encryption key. Set DOCUMENT_ENCRYPTION_KEY environment variable for production.');
    return process.env.GENERATED_KEY || this.generateSecureKey();
  }

  /**
   * Generate a cryptographically secure key
   */
  private static generateSecureKey(): string {
    return randomBytes(32).toString('hex'); // 256-bit key
  }

  /**
   * Encrypt document content using AES-256-CBC
   */
  static encryptContent(content: string | Buffer): { 
    encryptedData: string; 
    iv: string; 
    metadata: EncryptionMetadata 
  } {
    try {
      const key = this.getEncryptionKey();
      const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE);
      
      // Convert content to string if it's a Buffer
      const contentString = Buffer.isBuffer(content) ? content.toString('base64') : content;
      
      // Encrypt the content
      const encrypted = CryptoJS.AES.encrypt(contentString, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.PKCS7
      });

      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-CBC',
        encryptedAt: new Date().toISOString(),
        contentType: Buffer.isBuffer(content) ? 'binary' : 'text',
        originalSize: Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content, 'utf8')
      };

      return {
        encryptedData: encrypted.toString(),
        iv: iv.toString(),
        metadata
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt document content');
    }
  }

  /**
   * Decrypt document content
   */
  static decryptContent(encryptedData: string, iv: string, metadata: EncryptionMetadata): string | Buffer {
    try {
      const key = this.getEncryptionKey();
      const ivWordArray = CryptoJS.enc.Hex.parse(iv);
      
      // Decrypt the content
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.PKCS7
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption resulted in empty content');
      }

      // Return as Buffer if original content was binary
      if (metadata.contentType === 'binary') {
        return Buffer.from(decryptedString, 'base64');
      }
      
      return decryptedString;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt document content');
    }
  }

  /**
   * Encrypt file metadata for additional security
   */
  static encryptMetadata(metadata: any): string {
    try {
      const key = this.getEncryptionKey();
      const metadataString = JSON.stringify(metadata);
      const encrypted = CryptoJS.AES.encrypt(metadataString, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Metadata encryption failed:', error);
      throw new Error('Failed to encrypt metadata');
    }
  }

  /**
   * Decrypt file metadata
   */
  static decryptMetadata(encryptedMetadata: string): any {
    try {
      const key = this.getEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedMetadata, key);
      const metadataString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(metadataString);
    } catch (error) {
      console.error('Metadata decryption failed:', error);
      throw new Error('Failed to decrypt metadata');
    }
  }

  /**
   * Generate a secure hash for content integrity verification
   */
  static generateContentHash(content: string | Buffer): string {
    const contentString = Buffer.isBuffer(content) ? content.toString('base64') : content;
    return CryptoJS.SHA256(contentString).toString();
  }

  /**
   * Verify content integrity using hash
   */
  static verifyContentIntegrity(content: string | Buffer, expectedHash: string): boolean {
    const actualHash = this.generateContentHash(content);
    return actualHash === expectedHash;
  }
}

/**
 * Encryption metadata interface
 */
export interface EncryptionMetadata {
  algorithm: string;
  encryptedAt: string;
  contentType: 'text' | 'binary';
  originalSize: number;
}

/**
 * Encrypted document structure
 */
export interface EncryptedDocument {
  encryptedContent: string;
  iv: string;
  encryptionMetadata: EncryptionMetadata;
  contentHash: string;
  encryptedFileMetadata?: string;
}