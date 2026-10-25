/**
 * Created by 11Hopem
 * Copyright (c) 2026 11Hopem. All rights reserved.
 * Licensed under 11Hopem Proprietary License.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Autonomous Local Data Backup Service.
 * Ensures 100% local custody of user financial profiles with SHA-256 cryptographic checksums.
 */
export class BackupService {
  /**
   * Create an encrypted/hashed rotating backup file
   * @param {Object} financialData - Financial profile and ledger records
   * @param {string} storageDir - Target directory for backups
   * @returns {Object} Backup metadata
   */
  static createBackup(financialData, storageDir = path.resolve(process.cwd(), 'data/backups')) {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const payload = JSON.stringify(financialData, null, 2);
    const checksum = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `finance-backup-${timestamp}.json`;
    const targetPath = path.join(storageDir, filename);

    const record = {
      backupTimestamp: new Date().toISOString(),
      version: '1.0.0',
      checksum,
      author: '11Hopem Finance Vault',
      data: financialData
    };

    fs.writeFileSync(targetPath, JSON.stringify(record, null, 2), 'utf8');

    // Maintain max 10 rotating backups
    this.rotateBackups(storageDir, 10);

    return {
      success: true,
      filename,
      targetPath,
      checksum
    };
  }

  /**
   * Clean up old backups exceeding retention limit
   * @param {string} dir
   * @param {number} maxKeep
   */
  static rotateBackups(dir, maxKeep = 10) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('finance-backup-') && f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxKeep) {
      const toRemove = files.slice(maxKeep);
      for (const item of toRemove) {
        try {
          fs.unlinkSync(path.join(dir, item.name));
        } catch {
          // Non-blocking cleanup
        }
      }
    }
  }

  /**
   * Verify integrity of a saved backup file
   * @param {string} filePath
   * @returns {boolean}
   */
  static verifyBackup(filePath) {
    if (!fs.existsSync(filePath)) return false;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      const computedHash = crypto.createHash('sha256')
        .update(JSON.stringify(parsed.data, null, 2), 'utf8')
        .digest('hex');
      return computedHash === parsed.checksum;
    } catch {
      return false;
    }
  }
}
