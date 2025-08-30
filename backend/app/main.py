from fastapi import FastAPI, WebSocket
from kafka import KafkaProducer, KafkaConsumer
import threading
from aiokafka import AIOKafkaConsumer
from fastapi.middleware.cors import CORSMiddleware
producer = KafkaProducer(bootstrap_servers="localhost:9092")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ton frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Kafka Producer

from pydantic import BaseModel

class Message(BaseModel):
    username: str
    message: str

@app.post("/send/")
async def send_message(msg: Message):
    data = f"{msg.username}: {msg.message}"
    producer.send("chat-messages", data.encode("utf-8"))
    return {"status": "sent", "message": data}
import asyncio
# Kafka Consumer
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    consumer = AIOKafkaConsumer(
        "chat-messages",
        bootstrap_servers="localhost:9092",
        group_id=None,  # chaque websocket reçoit tous les messages
        auto_offset_reset="latest"
    )

    await consumer.start()
    try:
        async for msg in consumer:
            await websocket.send_text(msg.value.decode("utf-8"))
    finally:
        await consumer.stop()
