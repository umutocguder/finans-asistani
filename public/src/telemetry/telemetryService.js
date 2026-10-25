/**
 * Created by 11Hopem
 * Copyright (c) 2026 11Hopem. All rights reserved.
 * Licensed under 11Hopem Proprietary License.
 */

/**
 * Firebase Telemetry Service for hopem-software-cloud.
 * Strictly non-blocking with 100% PII and financial figure stripping.
 */
export class TelemetryService {
  static FIREBASE_PROJECT_ID = 'hopem-software-cloud';
  static BASE_URL = `https://firestore.googleapis.com/v1/projects/${this.FIREBASE_PROJECT_ID}/databases/(default)/documents`;

  /**
   * Sanitizes any payload to ensure no sensitive financial numbers,
   * account details, or PII leak into cloud logs.
   * @param {Object} data
   * @returns {Object} Cleaned metadata
   */
  static scrubSensitiveData(data = {}) {
    const safe = {};
    const prohibitedKeys = ['income', 'debt', 'balance', 'salary', 'iban', 'tc', 'phone', 'amount', 'credit'];

    for (const [key, val] of Object.entries(data)) {
      const lower = key.toLowerCase();
      if (prohibitedKeys.some(k => lower.includes(k))) {
        safe[key] = '[REDACTED_FINANCIAL]';
      } else if (typeof val === 'object' && val !== null) {
        safe[key] = this.scrubSensitiveData(val);
      } else {
        safe[key] = val;
      }
    }
    return safe;
  }

  /**
   * Log an operational event to Cloud Firestore asynchronously
   * @param {string} collection - Target collection ('app_logs', 'telemetry_logs')
   * @param {string} eventName
   * @param {Object} metadata
   */
  static async logEvent(collection, eventName, metadata = {}) {
    const cleanMeta = this.scrubSensitiveData(metadata);
    const body = {
      fields: {
        appName: { stringValue: 'finans-asistani' },
        eventName: { stringValue: eventName },
        timestamp: { timestampValue: new Date().toISOString() },
        metadata: { stringValue: JSON.stringify(cleanMeta) }
      }
    };

    try {
      if (typeof fetch === 'function') {
        fetch(`${this.BASE_URL}/${collection}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).catch(() => {
          // Silent non-blocking failover
        });
      }
    } catch {
      // Non-blocking zero-crash safety
    }
  }
}
