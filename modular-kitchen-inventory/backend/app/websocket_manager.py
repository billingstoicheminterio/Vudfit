from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"WebSocket client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        # We make a copy of the list to avoid mutation issues during iteration
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending message to client: {e}")
                # Remove stale connection
                try:
                    self.active_connections.remove(connection)
                except ValueError:
                    pass

ws_manager = ConnectionManager()

async def broadcast_refresh():
    await ws_manager.broadcast({"type": "REFRESH_DASHBOARD"})

