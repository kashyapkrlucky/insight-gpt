declare module "ws" {
  const WebSocket: {
    new (address: string | URL, protocols?: string | string[]): globalThis.WebSocket;
    [key: string]: unknown;
  };

  export default WebSocket;
}
