import localforage from 'localforage';
import type { FuelRequest } from './types';

localforage.config({
  name: 'FDCS_MegaProject_Portal',
  storeName: 'offline_data',
});

export const db = {
  async saveReceipt(deliveryId: string, receiptData: unknown) {
    const key = `receipt_${deliveryId}`;
    await localforage.setItem(key, receiptData);
  },
  async getReceipt(deliveryId: string) {
    return await localforage.getItem(`receipt_${deliveryId}`);
  },
  async getAllPendingReceipts() {
    const receipts: unknown[] = [];
    await localforage.iterate((value, key) => {
      if (key.startsWith('receipt_')) {
        receipts.push(value);
      }
    });
    return receipts;
  },
  async clearReceipt(deliveryId: string) {
    await localforage.removeItem(`receipt_${deliveryId}`);
  },
  async saveRequest(requestId: string, requestData: FuelRequest) {
    const key = `request_${requestId}`;
    await localforage.setItem(key, requestData);
  },
  async getAllPendingRequests() {
    const requests: FuelRequest[] = [];
    await localforage.iterate((value, key) => {
      if (key.startsWith('request_')) {
        requests.push(value as FuelRequest);
      }
    });
    return requests;
  },
  async clearRequest(requestId: string) {
    await localforage.removeItem(`request_${requestId}`);
  },
};
