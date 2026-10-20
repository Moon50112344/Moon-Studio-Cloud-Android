declare module '@novnc/novnc' {
  export default class RFB {
    constructor(target: HTMLElement, url: string, options?: any);
    scaleViewport: boolean;
    resizeSession: boolean;
    disconnect(): void;
    sendCredentials(credentials: any): void;
    sendKey(keysym: number, code: string, down?: boolean): void;
    addEventListener(type: string, listener: (event: any) => void): void;
    removeEventListener(type: string, listener: (event: any) => void): void;
  }
}
