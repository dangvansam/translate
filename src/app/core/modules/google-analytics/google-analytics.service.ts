import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GoogleAnalyticsService {
  traces: { name: string; time: number }[] = [];

  constructor() {}

  get isSupported() {
    return false; // Luôn trả về false để vô hiệu hóa tất cả chức năng
  }

  async setCurrentScreen(screenName: string) {
    // Không làm gì cả
  }

  logPerformanceMetrics() {
    // Không làm gì cả
  }

  async trace<T>(timingCategory: string, timingVar: string, callable: () => T): Promise<T> {
    return callable(); // Gọi trực tiếp mà không đo lường
  }
}
