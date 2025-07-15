/**
 * Personal Information Redaction System
 * Automatically detects and redacts sensitive personal information from documents
 */

export interface RedactionResult {
  redactedContent: string;
  redactedItems: RedactedItem[];
  originalLength: number;
  redactedLength: number;
}

export interface RedactedItem {
  type: 'ssn' | 'driverlicense' | 'bankaccount' | 'creditcard' | 'address' | 'name' | 'phone' | 'email' | 'dob';
  originalValue: string;
  redactedValue: string;
  position: number;
  length: number;
}

export class PersonalInfoRedactor {
  
  /**
   * Redaction patterns for different types of personal information
   */
  private static readonly redactionPatterns = {
    // Social Security Numbers (XXX-XX-XXXX, XXXXXXXXX)
    ssn: [
      /\b\d{3}-\d{2}-\d{4}\b/g,
      /\b\d{9}\b/g,
      /\b\d{3}\s\d{2}\s\d{4}\b/g
    ],
    
    // Driver's License Numbers (varies by state)
    driverlicense: [
      /\b[A-Z]{1,2}\d{6,8}\b/g,  // Common format
      /\b\d{8,12}\b/g,            // Numeric licenses
      /\b[A-Z]\d{7,8}\b/g         // Letter + numbers
    ],
    
    // Bank Account Numbers
    bankaccount: [
      /\b\d{8,17}\b/g,            // Standard bank account
      /\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g  // Formatted account
    ],
    
    // Credit Card Numbers
    creditcard: [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,  // Standard credit card
      /\b\d{15,16}\b/g            // Continuous digits
    ],
    
    // Phone Numbers
    phone: [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,           // XXX-XXX-XXXX
      /\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b/g,        // (XXX) XXX-XXXX
      /\b\d{10}\b/g,                              // XXXXXXXXXX
      /\b1[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b/g     // 1-XXX-XXX-XXXX
    ],
    
    // Email Addresses
    email: [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    ],
    
    // Dates of Birth (MM/DD/YYYY, MM-DD-YYYY, etc.)
    dob: [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
      /\b\d{4}-\d{1,2}-\d{1,2}\b/g
    ],
    
    // Address patterns
    address: [
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Place|Pl|Court|Ct|Way|Circle|Cir)\b/gi,
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Place|Pl|Court|Ct|Way|Circle|Cir)\s*,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/gi
    ]
  };
  
  /**
   * Redact personal information from document content
   */
  static redactPersonalInfo(content: string, fileName: string = ''): RedactionResult {
    let redactedContent = content;
    const redactedItems: RedactedItem[] = [];
    const originalLength = content.length;
    
    // Track position adjustments due to redactions
    let positionOffset = 0;
    
    // Redact SSNs
    this.redactionPatterns.ssn.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        if (match.index !== undefined) {
          const redactedValue = '[REDACTED-SSN]';
          redactedContent = redactedContent.replace(match[0], redactedValue);
          
          redactedItems.push({
            type: 'ssn',
            originalValue: match[0],
            redactedValue: redactedValue,
            position: match.index - positionOffset,
            length: match[0].length
          });
          
          positionOffset += match[0].length - redactedValue.length;
        }
      });
    });
    
    // Redact Driver's License Numbers
    this.redactionPatterns.driverlicense.forEach(pattern => {
      const matches = [...redactedContent.matchAll(pattern)];
      matches.forEach(match => {
        if (match.index !== undefined && this.isLikelyDriverLicense(match[0])) {
          const redactedValue = '[REDACTED-DL]';
          redactedContent = redactedContent.replace(match[0], redactedValue);
          
          redactedItems.push({
            type: 'driverlicense',
            originalValue: match[0],
            redactedValue: redactedValue,
            position: match.index,
            length: match[0].length
          });
        }
      });
    });
    
    // Redact Bank Account Numbers
    this.redactionPatterns.bankaccount.forEach(pattern => {
      const matches = [...redactedContent.matchAll(pattern)];
      matches.forEach(match => {
        if (match.index !== undefined && this.isLikelyBankAccount(match[0])) {
          const redactedValue = '[REDACTED-ACCOUNT]';
          redactedContent = redactedContent.replace(match[0], redactedValue);
          
          redactedItems.push({
            type: 'bankaccount',
            originalValue: match[0],
            redactedValue: redactedValue,
            position: match.index,
            length: match[0].length
          });
        }
      });
    });
    
    // Redact Credit Card Numbers
    this.redactionPatterns.creditcard.forEach(pattern => {
      const matches = [...redactedContent.matchAll(pattern)];
      matches.forEach(match => {
        if (match.index !== undefined && this.isLikelyCreditCard(match[0])) {
          const redactedValue = '[REDACTED-CARD]';
          redactedContent = redactedContent.replace(match[0], redactedValue);
          
          redactedItems.push({
            type: 'creditcard',
            originalValue: match[0],
            redactedValue: redactedValue,
            position: match.index,
            length: match[0].length
          });
        }
      });
    });
    
    // Context-aware Phone Number redaction
    const phoneContextPatterns: RegExp[] = [
      // Label + phone pattern, e.g. "Phone: (555) 123-4567" or "Tel 555-123-4567"
      /\b(?:Phone|Tel|Telephone|Contact|Mobile|Cell)\s*[:\-]?\s*(\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b/gi,
      // Stand-alone US phone with country code or delimiters but flanked by newline or parentheses (reduces false positives)
      /\n\s*(\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b/gi
    ];

    phoneContextPatterns.forEach(pattern => {
      const matches = [...redactedContent.matchAll(pattern)];
      matches.forEach(match => {
        if (match.index !== undefined) {
          // Extract the phone number substring (digits & punctuation)
          const phoneDigitsPattern = /(\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/;
          const numberMatch = phoneDigitsPattern.exec(match[0]);
          const target = numberMatch ? numberMatch[0] : match[0];
          const redactedValue = '[REDACTED-PHONE]';
          redactedContent = redactedContent.replace(target, redactedValue);

          redactedItems.push({
            type: 'phone',
            originalValue: target,
            redactedValue: redactedValue,
            position: match.index + (match[0].lastIndexOf(target)),
            length: target.length
          });
        }
      });
    });

    // Redact Email Addresses
    this.redactionPatterns.email.forEach(pattern => {
      const matches = [...redactedContent.matchAll(pattern)];
      matches.forEach(match => {
        if (match.index !== undefined) {
          const redactedValue = '[REDACTED-EMAIL]';
          redactedContent = redactedContent.replace(match[0], redactedValue);
          
          redactedItems.push({
            type: 'email',
            originalValue: match[0],
            redactedValue: redactedValue,
            position: match.index,
            length: match[0].length
          });
        }
      });
    });
    
    // Redact Dates of Birth
    this.redactionPatterns.dob.forEach(pattern => {
      const matches = [...redactedContent.matchAll(pattern)];
      matches.forEach(match => {
        if (match.index !== undefined && this.isLikelyDateOfBirth(match[0])) {
          const redactedValue = '[REDACTED-DOB]';
          redactedContent = redactedContent.replace(match[0], redactedValue);
          
          redactedItems.push({
            type: 'dob',
            originalValue: match[0],
            redactedValue: redactedValue,
            position: match.index,
            length: match[0].length
          });
        }
      });
    });
    
    // Context-aware Address redaction
    const addressContextPatterns: RegExp[] = [
      // Label + full single-line address ending with state & ZIP
      /\b(?:Address|Mailing Address|Residence|Street Address|Location)\s*[:\-]?\s*\d+\s+[A-Za-z0-9\s]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Place|Pl|Court|Ct|Way|Circle|Cir)\b[^,\n]*,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/gi,
      // Multi-line address block (number street \n city, ST ZIP)
      /\d+\s+[A-Za-z0-9\s]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Place|Pl|Court|Ct|Way|Circle|Cir)\s*[\r\n]+[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?/gi
    ];

    addressContextPatterns.forEach(pattern => {
      const matches = [...redactedContent.matchAll(pattern)];
      matches.forEach(match => {
        if (match.index !== undefined) {
          const redactedValue = '[REDACTED-ADDRESS]';
          redactedContent = redactedContent.replace(match[0], redactedValue);
          
          redactedItems.push({
            type: 'address',
            originalValue: match[0],
            redactedValue: redactedValue,
            position: match.index,
            length: match[0].length
          });
        }
      });
    });
    
    // Context-aware personal name redaction
    // ‑ We only redact names when they appear in typical identifying contexts to reduce false positives
    // ‑ Examples:  "Name: John Doe", "Mr. John Doe", "Signed by Jane Smith"
    const nameContextPatterns: RegExp[] = [
      // Honorifics followed by two capitalised words (first & last name)
      /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
      // Explicit "Name:" style labels
      /\b(?:Name|Client Name|Patient Name|Attorney Name|Signed by)\s*:?\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g
    ];

    nameContextPatterns.forEach(pattern => {
      const matches = [...redactedContent.matchAll(pattern)];
      matches.forEach(match => {
        if (match.index !== undefined) {
          // Extract the actual name (last two words) rather than the full line when possible
          const nameMatch = /([A-Z][a-z]+\s+[A-Z][a-z]+)$/.exec(match[0]);
          const target = nameMatch ? nameMatch[0] : match[0];
          const redactedValue = '[REDACTED-NAME]';
          redactedContent = redactedContent.replace(target, redactedValue);

          redactedItems.push({
            type: 'name',
            originalValue: target,
            redactedValue: redactedValue,
            position: match.index + (match[0].lastIndexOf(target)),
            length: target.length
          });
        }
      });
    });
    
    console.log(`Personal info redaction completed for ${fileName}:`);
    console.log(`  Original length: ${originalLength} characters`);
    console.log(`  Redacted length: ${redactedContent.length} characters`);
    console.log(`  Items redacted: ${redactedItems.length}`);
    console.log(`  Redaction types: ${[...new Set(redactedItems.map(item => item.type))].join(', ')}`);
    
    return {
      redactedContent,
      redactedItems,
      originalLength,
      redactedLength: redactedContent.length
    };
  }
  
  /**
   * Check if a number is likely a driver's license
   */
  private static isLikelyDriverLicense(value: string): boolean {
    // Basic heuristics to avoid false positives
    const cleanValue = value.replace(/\s|-/g, '');
    
    // Too short or too long
    if (cleanValue.length < 6 || cleanValue.length > 12) {
      return false;
    }
    
    // All zeros or all same digit (unlikely)
    if (/^(.)\1+$/.test(cleanValue)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if a number is likely a bank account
   */
  private static isLikelyBankAccount(value: string): boolean {
    const cleanValue = value.replace(/\s|-/g, '');
    
    // Bank accounts are typically 8-17 digits
    if (cleanValue.length < 8 || cleanValue.length > 17) {
      return false;
    }
    
    // All zeros or all same digit (unlikely)
    if (/^(.)\1+$/.test(cleanValue)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if a number is likely a credit card
   */
  private static isLikelyCreditCard(value: string): boolean {
    const cleanValue = value.replace(/\s|-/g, '');
    
    // Credit cards are typically 15-16 digits
    if (cleanValue.length < 15 || cleanValue.length > 16) {
      return false;
    }
    
    // Basic Luhn algorithm check
    return this.luhnCheck(cleanValue);
  }
  
  /**
   * Luhn algorithm to validate credit card numbers
   */
  private static luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let alternate = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      
      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      alternate = !alternate;
    }
    
    return sum % 10 === 0;
  }
  
  /**
   * Check if a number is likely a phone number
   */
  private static isLikelyPhoneNumber(value: string): boolean {
    const cleanValue = value.replace(/\D/g, '');
    
    // US phone numbers are 10 digits (or 11 with country code)
    if (cleanValue.length !== 10 && cleanValue.length !== 11) {
      return false;
    }
    
    // Can't start with 0 or 1
    if (cleanValue[0] === '0' || cleanValue[0] === '1') {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if a date is likely a date of birth
   */
  private static isLikelyDateOfBirth(value: string): boolean {
    const date = new Date(value);
    const now = new Date();
    const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
    
    // Must be a valid date
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Must be between 100 years ago and today
    return date >= hundredYearsAgo && date <= now;
  }
  
  /**
   * Get redaction summary
   */
  static getRedactionSummary(result: RedactionResult): string {
    const typeCount = result.redactedItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const typeLabels = {
      ssn: 'Social Security Numbers',
      driverlicense: 'Driver License Numbers',
      bankaccount: 'Bank Account Numbers',
      creditcard: 'Credit Card Numbers',
      phone: 'Phone Numbers',
      email: 'Email Addresses',
      dob: 'Dates of Birth',
      address: 'Addresses',
      name: 'Personal Names'
    };
    
    const summary = Object.entries(typeCount)
      .map(([type, count]) => `${count} ${typeLabels[type as keyof typeof typeLabels] || type}`)
      .join(', ');
    
    return summary || 'No personal information detected';
  }
}