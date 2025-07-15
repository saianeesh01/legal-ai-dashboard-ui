import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

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
      const key = Buffer.from(this.getEncryptionKey(), 'hex');
      const iv = randomBytes(this.IV_SIZE);
      
      // Convert content to buffer
      const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
      
      // Create cipher and encrypt
      const cipher = createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(contentBuffer, null, 'hex');
      encrypted += cipher.final('hex');

      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-CBC',
        encryptedAt: new Date().toISOString(),
        contentType: Buffer.isBuffer(content) ? 'binary' : 'text',
        originalSize: Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content, 'utf8')
      };

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
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
      const key = Buffer.from(this.getEncryptionKey(), 'hex');
      
      // Create decipher and decrypt
      const ivBuffer = Buffer.from(iv, 'hex');
      const decipher = createDecipheriv('aes-256-cbc', key, ivBuffer);
      
      let decrypted = decipher.update(encryptedData, 'hex', null);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      // Return as Buffer if original content was binary
      if (metadata.contentType === 'binary') {
        return decrypted;
      }
      
      return decrypted.toString('utf8');
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
      const key = Buffer.from(this.getEncryptionKey(), 'hex');
      const metadataString = JSON.stringify(metadata);
      
      const iv = randomBytes(16);
      const cipher = createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(metadataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Prepend IV to encrypted data
      encrypted = iv.toString('hex') + ':' + encrypted;
      
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
      const key = Buffer.from(this.getEncryptionKey(), 'hex');
      
      // Split IV and encrypted data
      const [ivHex, encryptedData] = encryptedMetadata.split(':');
      const ivBuffer = Buffer.from(ivHex, 'hex');
      
      const decipher = createDecipheriv('aes-256-cbc', key, ivBuffer);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
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
    return createHash('sha256').update(contentString).digest('hex');
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