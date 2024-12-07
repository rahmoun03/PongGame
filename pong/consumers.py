import json
import random
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import logging

logger = logging.getLogger(__name__)


class AIConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_room = f"room_{random.randint(1, 999)}"
        self.is_active = True
        self.player_id = None
        self.width = 800
        self.height = 400
        self.speed = 3
        self.ball = {}
        self.mode = None
        self.paddleSize = {}
        self.players = {}
        self.score = {}

        print("scope : " ,self.scope)
        logger.info(f"Player connected to {self.game_room}")
        
        await self.channel_layer.group_add(self.game_room, self.channel_name)
        await self.accept()
    

    async def disconnect(self, close_code):
        self.is_active = False
        await self.channel_layer.group_discard(self.game_room, self.channel_name)
        # if self in player_queue:
        #     player_queue.remove(self)

        



    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)

        if data["type"] == "start_game":
            await self.start_game()

        if data["type"] == "countdown":
            print("start_countdown")
            self.mode = data["mode"]
            self.width = data["width"]
            self.height = data["height"]
            self.reset_game()
            await self.channel_layer.group_send(self.game_room, {
                "type" : "start"
            })

        if data["type"] == "update_paddle":
            self.players["player1"]["playerDirection"] = data["playerDirection"]



    
    async def game_loop(self):
        while self.is_active:
            self.update_game()
            if self.score["player1"] >= self.scoreLimit or self.score["player2"] >= self.scoreLimit or self.is_active == False:
                print("GAME OVER!\n")
                if self.is_active :
                    await self.send_game_over()
                    self.is_active = False
                break
            else :
                await self.send_game_state()
            await asyncio.sleep(0.013)  # Adjust the delay as needed
    

    def reset_game(self):
        self.scoreLimit = 3

        self.ball = {
            "x": self.width / 2,
            "y": self.height / 2,
            "dx": 3 if random.randint(0,1) > 0.5 else -3,
            "dy": 3 if random.randint(0,1) > 0.5 else -3,
            "radius": 10
            }
        self.paddleSize = {"W": 10, "H": 80}
        self.players = {
            "player1": {
                "x": 5,
                "y": self.height / 2 - self.paddleSize["H"] / 2,
                "playerDirection": 0
            }, 
            "player2": {
                "x": self.width - self.paddleSize["W"] - 5,
                "y": self.height / 2 - self.paddleSize["H"] / 2,
                "playerDirection": 0
            }}
        self.score = {"player1": 0, "player2": 0}

    def update_game(self):
        self.ball["x"] += self.ball["dx"]
        self.ball["y"] += self.ball["dy"]
        self.move_player1()
        self.move_player2()
        self.check_collision()
        self.checkGoals()




    def move_player1(self):
        self.players["player1"]["y"] += self.players["player1"]["playerDirection"] * self.speed
        
        if self.players["player1"]["y"] < 0 : self.players["player1"]["y"] = 0
        if self.players["player1"]["y"] > self.height - self.paddleSize["H"] : self.players["player1"]["y"] = self.height - self.paddleSize["H"]

    def move_player2(self):
        # Move AI paddle (simple tracking)
        if self.ball["y"] > self.players["player2"]["y"] + self.paddleSize["H"] / 2 : self.players["player2"]["y"] += self.speed # Move down
        if self.ball["y"] < self.players["player2"]["y"] + self.paddleSize["H"] / 2 : self.players["player2"]["y"] -= self.speed # Move up

        if self.players["player2"]["y"] < 0 : self.players["player2"]["y"] = 0
        if self.players["player2"]["y"] > self.height - self.paddleSize["H"] : self.players["player2"]["y"] = self.height - self.paddleSize["H"]


    def check_collision(self):
        # check for top and bottom ball collision
        if(self.ball["y"] + self.ball["radius"] > self.height or self.ball["y"] - self.ball["radius"] < 0):
            self.ball["dy"] *= -1

        # check for paddle and ball collision  PLAYER 1
        if self.ball["x"] - self.ball["radius"] < self.players["player1"]['x'] + self.paddleSize["W"] and self.players["player1"]["y"] <= self.ball["y"] <= self.players["player1"]["y"] + self.paddleSize["H"]:
            #check for bottom paddle corner
            if self.ball["y"] > self.players["player1"]["y"] + (self.paddleSize["H"] -  (self.paddleSize["H"] / 10)):
                self.ball["dy"] *= -1 if self.ball["dy"] < 0 else 1 #Bounce the ball back
            
            #check for top paddle corner
            elif self.ball["y"] < self.players["player1"]["y"] + self.paddleSize["H"] / 10:
                self.ball["dy"] *= -1 if self.ball["dy"] > 0 else  1 #Bounce the ball back
            
            self.ball["dx"] *= -1
            self.ball["dx"] *= 1.05 # Ball speed increase after hit
            # self.ball["dx"] += (-0.5 if self.players["player1"]["playerDirection"] == 1 else 0) * self.speed
            # self.ball["dx"] += ( 0.5 if self.players["player1"]["playerDirection"] == -1 else 0) * self.speed

            


        # check for paddle and ball collision  PLAYER 2
        if self.ball["x"] + self.ball["radius"] > self.players["player2"]['x'] and self.players["player2"]["y"] <= self.ball["y"] <= self.players["player2"]["y"] + self.paddleSize["H"]:
            #check for bottom paddle corner
            if self.ball["y"] > self.players["player2"]["y"] + (self.paddleSize["H"] -  (self.paddleSize["H"] / 10)):
                self.ball["dy"] *= -1 if self.ball["dy"] < 0 else 1 #Bounce the ball back
            
            #check for top paddle corner
            elif self.ball["y"] < self.players["player2"]["y"] + self.paddleSize["H"] / 10:
                self.ball["dy"] *= -1 if self.ball["dy"] > 0 else  1 #Bounce the ball back
            
            self.ball["dx"] *= -1
            self.ball["dx"] *= 1.05 # Ball speed increase after hit
            # self.ball["dx"] += (-0.5 if self.players["player2"]["playerDirection"] == 1 else 0) * self.speed
            # self.ball["dx"] += ( 0.5 if self.players["player2"]["playerDirection"] == -1 else 0) * self.speed

    def checkGoals(self):
        # PLAYER 2 scores
        if self.ball["x"] <= 0 : 
            self.score["player2"] += 1
            self.reset_ball()
        # PLAYER 1 scores
        if self.ball["x"] >= self.width : 
            self.score["player1"] += 1
            self.reset_ball()

    def reset_ball(self):
        self.ball["x"] = self.width / 2
        self.ball["y"] = self.height / 2

        self.ball["dx"] = 3 if random.randint(0,1) > 0.5 else -3
        self.ball["dy"] = 3 if random.randint(0,1) > 0.5 else -3

    async def send_game_over(self):
        print("SEND GAME OVER")
        await self.channel_layer.group_send(self.game_room, {
            "type" : "game_over"
        })  
        
    async def game_over(self, event):
        await self.send(text_data=json.dumps({
            "type": "game_over",
            "score": self.score,
            "winner": "player1" if self.score["player1"] >= self.scoreLimit else "player2"
        }))

    async def send_game_state(self):
        await self.channel_layer.group_send(self.game_room, {
            "type" : "update"
        })
    
    async def update(self, event):
        await self.send(text_data=json.dumps({
            "type": "update",
            "players": self.players,
            "ball": self.ball,
            "score": self.score
        }))

    async def start(self, event):
        await self.send(text_data=json.dumps({
            "type": "start",
            "players": self.players,
            "ball": self.ball,
            "score": self.score,
            "paddle": self.paddleSize
        }))

    async def start_game(self):
        await self.send_game_state()
        asyncio.create_task(self.game_loop())

