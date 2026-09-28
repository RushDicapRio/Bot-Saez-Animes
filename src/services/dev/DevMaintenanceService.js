const dbManager = require('../../utils/database');
class DevMaintenanceService {
  /**
   * @returns {boolean}
   */
  static isMaintenanceEnabled() {
    try {
      const state = dbManager.getMaintenance();
      return Boolean(state && state.enabled);
    } catch {
      return false;
    }
  }
  /**
   * @returns {boolean}
   */
  static isSafeModeEnabled() {
    try {
      const state = dbManager.getMaintenance();
      return Boolean(state && state.safe_mode);
    } catch {
      return false;
    }
  }
  /**
   * @param {boolean} enabled 
   * @param {string} [message] 
   */
  static setMaintenance(enabled, message) {
    return dbManager.setMaintenance({ enabled, message });
  }
  /**
   * @param {boolean} safe_mode 
   */
  static setSafeMode(safe_mode) {
    return dbManager.setMaintenance({ safe_mode });
  }
  static getStatus() {
    return dbManager.getMaintenance();
  }
}
module.exports = DevMaintenanceService;
