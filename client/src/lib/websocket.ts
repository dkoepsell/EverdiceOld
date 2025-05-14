/**
 * WebSocket connection handler for real-time dice roll updates
 */
let socket: WebSocket | null = null;

export function createWSConnection() {
  try {
    // Determine if we're in a secure context
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Handle different message types
        if (data.type === 'dice_roll') {
          // Dispatch custom event for dice roll results
          window.dispatchEvent(new CustomEvent('dice_roll_result', { 
            detail: data.payload 
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        createWSConnection();
      }, 5000);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
  }
}

export function sendWSMessage(type: string, payload: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  } else {
    console.warn('WebSocket not connected, cannot send message');
  }
}

// Close connection when window closes
window.addEventListener('beforeunload', () => {
  if (socket) {
    socket.close();
  }
});