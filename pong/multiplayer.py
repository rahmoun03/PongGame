import json
import random
import asyncio
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer # type: ignore

player_queue = []

class GameSettings:
    WINNING_SCORE = 5
    BALL_SPEED_INCREASE = 1.05
    FRAME_DELAY = 0.015
    PADDLE_HEIGHT_RATIO = 5  # screen height / 5
    PADDLE_WIDTH_RATIO = 80  # screen width / 80

class MultiplayerConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        player_queue.append(self)
        self.is_active = True
        self.width = 800
        self.height = 400
        self.speed = 5
        self.paddle = {
            "height": 80,
            "width": 10
        }
        self.group_room = None
        self.role = None
        self.ball = {}
        self.player1 = {}
        self.player2 = {}
        self.score = {}
        print(self.scope["user"], " are connected")
        await self.accept()

    async def disconnect(self, close_code):
        if self in player_queue:
            player_queue.remove(self)
        if self.group_room:
            await self.channel_layer.group_discard(
                self.group_room,
                self.channel_name
            )
        # Should also notify the other player about disconnection

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "join_room":
            self.width = data["width"]
            self.height = data["height"]
            await self.restart_game()
            if len(player_queue) >= 2 :
                if player_queue[0] == self:
                    opponent = player_queue[1]
                else:
                    opponent = player_queue[0]
                player_queue.remove(self)
                player_queue.remove(opponent)
                self.group_room = f"room_{uuid.uuid4().hex[:6]}"
                opponent.group_room = self.group_room

                opponent.role = "player2"
                self.role = "player1"

                # add the players to the same group
                await self.channel_layer.group_add(
                    self.group_room,
                    self.channel_name
                )
                await opponent.channel_layer.group_add(
                    opponent.group_room,
                    opponent.channel_name
                )

                dx = 1 if random.randint(0,1) > 0.5 else -1
                dy = 1 if random.randint(0,1) > 0.5 else -1

                await self.channel_layer.group_send(
                    self.group_room,
                    {
                        "type": "start",
                        "player1": self.player1,
                        "player2": self.player2,
                        "dx" : dx,
                        "dy" : dy,
                        "ball": self.ball,
                        "score": self.score,
                        "paddle": self.paddle,
                    }
                )


        if data["type"] == "update_paddle":
            if self.role == "player1":
                self.player1["direction"] = data["direction"]
            else:
                self.player2["direction"] = data["direction"]
    
            await self.channel_layer.group_send(
                self.group_room,
                {
                    "type": "update_paddle",
                    "role": self.role,
                    "player1": self.player1,
                    "player2": self.player2
                }
            )

        
        # if data["type"] == "resize":
        #     self.width = data["width"]
        #     self.height = data["height"]
        #     self.restart_game()
        #     await self.channel_layer.group_send(
        #         self.group_room,
        #         {
        #             "type": "start",
        #             "player1": self.player1,
        #             "player2": self.player2,
        #             "ball": self.ball,
        #             "score": self.score,
        #             "paddle": self.paddle,
        #         }
        #     )

        
        if data["type"] == "start_game":
            print(self.scope["user"], ": starting the game")
            asyncio.create_task(self.start_game())
                



    async def start_game(self):
        while self.is_active:
            #update_paddle paddle
            self.move_paddel(self.player1)
            self.move_paddel(self.player2)
            self.move_ball()
            await self.check_goals()
            if self.score["player1"] >= 5 or self.score["player2"] >= 5:
                await self.send_game_over()
                break
            await self.send_update()
            await asyncio.sleep(0.016)

    async def send_update(self):
        await self.send(json.dumps(
            {
                "type": "update",
                "player1": self.player1,
                "player2": self.player2,
                "ball": self.ball,
                "score": self.score,
            }))

    async def send_game_over(self):
        await self.channel_layer.group_send(self.group_room, {
            "type" : "game_over"
        })

    async def game_over(self, event):
        if(self.is_active):
            print("game over : ", self.score)
            await self.send(json.dumps(
            {
                "type": "game_over",
                "score": self.score,
                "winner": "WIN" if self.score[self.role] >= 5 else "LOSE"
            }))
        self.is_active = False


    async def check_goals(self):
        # print(self.role , ": was here")
        if self.ball["x"] - self.ball["radius"] <= 0:
            if self.role == "player1" :
                await self.reset_ball("player2")
        elif self.ball["x"] + self.ball["radius"] >= self.width:
            if self.role == "player1" :
                await self.reset_ball("player1")
    
    async def reset_ball(self, player):
        dx = 1 if random.randint(0,1) > 0.5 else -1
        dy = 1 if random.randint(0,1) > 0.5 else -1

        # print(self.role , ": send to group : ", self.score)
        await self.channel_layer.group_send(self.group_room, {
            "type" : "goal",
            "who" : player,
            "dx" : dx,
            "dy": dy
        })
        

    async def goal(self, event):
        # print(self.role , "recieve .",)
        self.score[event["who"]] += 1
        self.ball["x"] = self.width / 2
        self.ball["y"] = self.height / 2
        self.ball["dx"] = self.ball_dx * event["dx"]
        self.ball["dy"] = self.ball_dy * event["dy"]

    def move_ball(self):
        self.ball["x"] += self.ball["dx"]
        self.ball["y"] += self.ball["dy"]

        if self.ball["y"] - self.ball["radius"] <= 0 or self.ball["y"] + self.ball["radius"] >= self.height:
            self.ball["dy"] *= -1

        # check for paddle and ball collision  PLAYER 1
        if self.ball["x"] - self.ball["radius"] <= self.player1['x'] + self.paddle["width"] and self.player1["y"] <= self.ball["y"] <= self.player1["y"] + self.paddle["height"]:
            #check for bottom paddle corner
            if self.ball["y"] > self.player1["y"] + (self.paddle["height"] -  (self.paddle["height"] / 10)):
                self.ball["dy"] *= -1 if self.ball["dy"] < 0 else 1 #Bounce the ball back
            
            #check for top paddle corner
            elif self.ball["y"] < self.player1["y"] + self.paddle["height"] / 10:
                self.ball["dy"] *= -1 if self.ball["dy"] > 0 else  1 #Bounce the ball back
            
            self.ball["dx"] *= -1
            self.ball["dx"] *= 1.05 # Ball speed increase after hit
            # self.ball["dx"] += (-0.5 if self.players["player1"]["playerDirection"] == 1 else 0) * self.speed
            # self.ball["dx"] += ( 0.5 if self.players["player1"]["playerDirection"] == -1 else 0) * self.speed

                 # check for paddle and ball collision  PLAYER 2
        if self.ball["x"] + self.ball["radius"] >= self.player2['x'] and self.player2["y"] <= self.ball["y"] <= self.player2["y"] + self.paddle["height"]:
            #check for bottom paddle corner
            if self.ball["y"] > self.player2["y"] + (self.paddle["height"] -  (self.paddle["height"] / 10)):
                self.ball["dy"] *= -1 if self.ball["dy"] < 0 else 1 #Bounce the ball back
            
            #check for top paddle corner
            elif self.ball["y"] < self.player2["y"] + self.paddle["height"] / 10:
                self.ball["dy"] *= -1 if self.ball["dy"] > 0 else  1 #Bounce the ball back
            
            self.ball["dx"] *= -1
            self.ball["dx"] *= 1.05 # Ball speed increase after hit
            # self.ball["dx"] += (-0.5 if self.players["player2"]["playerDirection"] == 1 else 0) * self.speed
            # self.ball["dx"] += ( 0.5 if self.players["player2"]["playerDirection"] == -1 else 0) * self.speed
        

    def move_paddel(self, player):
            player["y"] += player["direction"] * self.speed

            if player["y"] < 0:
                player["y"] = 0
            if player["y"] > self.height - self.paddle["height"]:
                player["y"] = self.height - self.paddle["height"]


    async def update_paddle(self, event):
        self.player1["direction"] = event["player1"]["direction"]
        self.player2["direction"] = event["player2"]["direction"]




    async def start(self, event):
        self.ball["dx"] = self.ball_dx * event["dx"]
        self.ball["dy"] = self.ball_dy * event["dy"]
        
        await self.send(json.dumps({
            "type": "start",
            "player1": self.player1,
            "player2": self.player2,
            "ball": self.ball,
            "score": self.score,
            "paddle": self.paddle,
        }))


    async def restart_game(self):

        self.paddle["height"] = self.height / 5  # Dynamic height based on screen size
        self.paddle["width"] = self.width / 80  # Dynamic width based on screen size
        ball_radius = self.height / 40  # Dynamic ball radius
        self.speed = self.height / 60
        self.ball_dx = self.width / 150  # Adjust ball speed according to width
        self.ball_dy = self.height / 150  # Adjust ball speed according to height


        self.player1 = {
            "x": self.paddle["width"] / 2,
            "y": (self.height / 2) - (self.paddle["height"] / 2),
            "direction": 0
        }
        self.player2 = {
            "x": self.width - self.paddle["width"] - (self.paddle["width"] / 2),
            "y": (self.height / 2) - (self.paddle["height"] / 2),
            "direction": 0
            }
        self.ball = {
            "x" : self.width / 2 ,
            "y" : self.height / 2,
            "dx": self.ball_dx if random.randint(0, 1) > 0.5 else -self.ball_dx,
            "dy": self.ball_dy if random.randint(0, 1) > 0.5 else -self.ball_dy,
            "radius": ball_radius
        }
        self.score = {
            "player1": 0,
            "player2": 0
        }
    