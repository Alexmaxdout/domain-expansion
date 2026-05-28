import asyncio
import atexit
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from camera import DomainCamera


camera = DomainCamera()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    camera.start()
    try:
        yield
    finally:
        camera.stop()


app = FastAPI(lifespan=lifespan)


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "camera_running": camera.is_running,
        "camera_error": camera.error,
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    last_event_id = camera.latest_event["id"] if camera.latest_event else 0

    if camera.error:
        await websocket.send_json({"error": camera.error})

    try:
        while True:
            event = camera.latest_event
            if event and event["id"] != last_event_id:
                last_event_id = event["id"]
                await websocket.send_json({"domain": event["domain"]})

            await asyncio.sleep(0.05)
    except WebSocketDisconnect:
        pass

atexit.register(camera.stop)
