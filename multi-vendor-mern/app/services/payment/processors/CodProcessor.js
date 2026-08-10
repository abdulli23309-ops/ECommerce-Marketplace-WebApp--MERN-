/**
 * Cash‑on‑delivery processor stub.
 * Phase 3: structure only – no database writes, no order status changes.
 */
export default class CodProcessor {
  /**
   * @param {Object} payment - Payment document
   * @param {Object} order   - ParentOrder document
   * @returns {Object} { status: 'pending' }
   */
  async process(payment, order) {
    // No gateway interaction; simply returns pending status.
    return { status: 'pending' };
  }
}