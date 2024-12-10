import json
import random
import asyncio
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer # type: ignore

player_queue = []

# class GameSettings:
WINNING_SCORE = 5
BALL_SPEED_INCREASE = 1.05
FRAME_DELAY = 0.015
PADDLE_HEIGHT_RATIO = 5  # screen height / 5
PADDLE_WIDTH_RATIO = 80  # screen width / 80
TABLE_HIEGHT = 45
TABLE_WIDTH = 28

class TrainConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        player_queue.append(self)
        self.is_active = True
        self.width = 800
        self.height = 400
        self.speed = 5
        self.paddle = {
            "height": 1,
            "width": 3,
            "deep": 1
        }
        self.group_room = "game_train"
        self.role = None
        self.ball = {}
        self.player1 = {}
        self.player2 = {}
        self.score = {}
        self.table = {}
        print(self.scope["user"], " are connected")
        await self.accept()

    async def disconnect(self, close_code):
        pass
        # Should also notify the other player about disconnection

    async def receive(self, text_data):

        data = json.loads(text_data)
        print("data : ", data)
        if data["type"] == "train":
            self.width = data["width"]
            self.height = data["height"]
            await self.restart_game()
            await self.start()


    async def start(self):
        await self.send(json.dumps({
            "type": "start",
            "player1": self.player1,
            "player2": self.player2,
            "ball": self.ball,
            "score": self.score,
            "paddle": self.paddle,
            "table" : self.table_config
        }))


    async def restart_game(self):

        self.paddle["height"] = 1  # Dynamic height based on screen size
        self.paddle["width"] = 3  # Dynamic width based on screen size
        self.paddle["deep"] = 1
        ball_radius = 0.5  # Dynamic ball radius
        self.speed = 1
        self.ball_dx = 1  # Adjust ball speed according to width
        self.ball_dy = 1  # Adjust ball speed according to height

        self.table_config = {
            "plane": {
                "PlaneGeometry": {
                    "tableWidth": TABLE_WIDTH,  # Use actual values
                    "tableHeight": TABLE_HIEGHT,
                },
                "MeshPhysicalMaterial": {
                    "side": "THREE.DoubleSide",
                    "reflectivity": 0,
                    "transmission": 1.0,
                    "roughness": 0.2,
                    "metalness": 0,
                    "clearcoat": 0.3,
                    "clearcoatRoughness": 0.25,
                    "color": 0xffffff,
                    "ior": 1.2
                },
            },
            "tableCenter": {
                "PlaneGeometry": {
                    "tableWidth": TABLE_WIDTH,
                    "height": 0.2
                },
                "MeshBasicMaterial": {
                    "color": "white"
                }
            }
        }

        self.player1 = {
            "x": 0,
            "y": 0.1,
            "z": -(TABLE_HIEGHT / 2),
            "direction": 0
        }

        self.player2 = {
            "x": 0,
            "y": 0.1,
            "z": TABLE_HIEGHT / 2,
            "direction": 0
            }

        self.ball = {
            "x" : 0,
            "y" : 0.1,
            "z" : 0,
            "dx": self.ball_dx if random.randint(0, 1) > 0.5 else -self.ball_dx,
            "dy": self.ball_dy if random.randint(0, 1) > 0.5 else -self.ball_dy,
            "radius": ball_radius
        }

        self.score = {
            "player1": 0,
            "player2": 0
        }
    