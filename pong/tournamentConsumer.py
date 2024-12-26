from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.apps import apps
import random
import asyncio
import uuid
import json

# class GameSettings:
WINNING_SCORE = 5
BALL_SPEED_INCREASE = 1.05
FRAME_DELAY = 0.015
PADDLE_HEIGHT_RATIO = 1 
PADDLE_WIDTH_RATIO = 4 
TABLE_HIEGHT = 45
TABLE_WIDTH = 28
BALL_SPEED = 0.2

class TournametSetup(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.room_group_name = "tournament_setup"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        print(data)

        if data["type"] == "update":
            tournaments = await self.get_pending_tournaments("pending")
            tournaments_list = [
                {"name": tournament["name"], "creator": tournament["creator"]}
                for tournament in tournaments
            ]
            await self.channel_layer.group_send(self.room_group_name, {
                "type": "update",
                "tournaments": tournaments_list
            })

        # create tournament
        if data["type"] == "create":
            exists = await self.check_tournament_exists(data["name"])
            if exists:
                await self.send(json.dumps({
                    "type": "error",
                    "message": "Tournament name already exists."
                }))
            else:
                if not await self.create_tournament(data):
                    await self.send(json.dumps({
                        "type": "error",
                        "message": "alias name already exists."
                    }))
                    return
                print("saving tournament")

                await self.send(json.dumps({
                    "type": "created",
                    "name": data["name"],
                    "creator": data["creator"]
                }))
                tournaments = await self.get_pending_tournaments("pending")
                tournaments_list = [
                    {"name": tournament["name"], "creator": tournament["creator"]}
                    for tournament in tournaments
                ]
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "update",
                    "tournaments": tournaments_list
                })
        
        #join tournament
        if data["type"] == "join":
            exists = await self.check_tournament_exists(data["name"])
            if exists:
                tournament = await self.get_tournament(data["name"])
                if not await self.add_participant(tournament, data):
                    await self.send(json.dumps({
                        "type": "error",
                        "message": "alias name already exists."
                    }))
                    return
                print("adding a participant")
                await self.send(json.dumps({
                    "type": "joined",
                    "name": tournament.name,
                    "player": data["player"]
                }))
            else:
                await self.send(json.dumps({
                    "type": "error",
                    "message": "Tournament not found."
                }))
        
        # delete tournament
        # elif data["type"] == "delete":
        #     success = await self.delete_tournament(data["name"])
        #     if success:
        #         await self.send(json.dumps({
        #             "type": "deleted",
        #             "name": data["name"]
        #         }))
        #     else:
        #         await self.send(json.dumps({
        #             "type": "error",
        #             "message": "Tournament not found."
        #         }))




    async def update(self, event):
        await self.send(text_data=json.dumps(event))



    @database_sync_to_async
    def get_tournament(self, name):
        Tournament = apps.get_model('pong', 'Tournament')
        return Tournament.objects.get(name=name)

    @database_sync_to_async
    def get_pending_tournaments(self, status):
        Tournament = apps.get_model('pong', 'Tournament')
        return list(Tournament.objects.filter(status=status).values("name", "creator"))

    @database_sync_to_async
    def check_tournament_exists(self, name):
        Tournament = apps.get_model('pong', 'Tournament')
        return Tournament.objects.filter(name=name).exists()

    @database_sync_to_async
    def create_tournament(self, data):
        Tournament = apps.get_model('pong', 'Tournament')
        User = apps.get_model('auth', 'User')
        Participant = apps.get_model('pong', 'Participant')


        try:
            user = User.objects.get(username=data["creator_username"])
        except User.DoesNotExist:
            return False
        # Check if the participant alias already exists
        if Participant.objects.filter(alias=data["creator"]).exists():
            return False

        participant = Participant.objects.create(alias=data["creator"])
        print("USER : ", user)
        tournament = Tournament.objects.create(
            name=data["name"],
            creator=data["creator"],
            creator_username=user,
        )
        tournament.save()
        tournament.add_participant(participant)
        tournament.save()
        return True
    
    @database_sync_to_async
    def create_unique_participant(self, alias):
        Participant = apps.get_model('pong', 'Participant')
        if Participant.objects.filter(alias=alias).exists():
            print("ALIAS EXISTS")
            return None
        participant = Participant.objects.create(alias=alias)
        participant.save()
        print("PARTICIPANT : ", participant)
        return participant


    @database_sync_to_async
    def add_participant(self, tournament, data):
        if tournament.is_full():
            return False
        Participant = apps.get_model('pong', 'Participant')
        if Participant.objects.filter(alias=data["player"]).exists():
            print("ALIAS EXISTS")
            return False
        participant = Participant.objects.create(alias=data["player"])
        tournament.add_participant(participant)
        tournament.save()
        return True

    # @database_sync_to_async
    # def delete_tournament(self, name):
    #     Tournament = apps.get_model('pong', 'Tournament')
    #     try:
    #         tournament = Tournament.objects.get(name=name)
    #         tournament.participants.clear()
    #         tournament.delete()
    #         return True
    #     except Tournament.DoesNotExist:
    #         return False


class RemoteMatchmaking(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = None
        self.alias = None
        self.participants = None
        self.tournament = None

        await self.accept()
    

    async def disconnect(self, close_code):
        pass


    async def receive(self, text_data):

        data = json.loads(text_data)
        print(data)
        if data["type"] == "join":
            self.tournament = await self.get_tournament(data["name"])
            self.room_group_name = data["name"].replace(" ", "_")
            self.alias = data["alias"]
            self.participants = await self.get_participants(self.tournament)
            list_of_participants = [participant["alias"] for participant in self.participants]
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.channel_layer.group_send(self.room_group_name, {
                "type": "update",
                "participants": list_of_participants
            })



    async def update(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_tournament(self, name):
        Tournament = apps.get_model('pong', 'Tournament')
        return Tournament.objects.get(name=name)
    

    @database_sync_to_async
    def get_participants(self, tournament):
        return list(tournament.participants.values("alias"))
    

class LocalMatchmaking(AsyncWebsocketConsumer):

    async def connect(self):
        self.participants = []
        self.matches = {}
        self.tournament = None
        self.current_round = 1
        self.passtMatch = []
        self.is_active = True
        self.mode = "local"
        self.width = 800
        self.height = 400
        self.speed = 1
        self.paddle = {
            "height": 0.5,
            "width": 5,
            "deep": 0.5
        }
        self.group_room = f"room_{random.randint(1, 999)}"
        self.ball = {}
        self.player1 = {}
        self.player2 = {}
        self.score = {}
        self.table = {}
        print(self.scope["user"], " are connected")
        await self.channel_layer.group_add(self.group_room, self.channel_name)

        await self.accept()
    

    async def disconnect(self, close_code):
        if self.group_room:
            await self.channel_layer.group_discard(
                self.group_room,
                self.channel_name
            )

    async def receive(self, text_data):

        data = json.loads(text_data)
        print(data)
        if data["type"] == "join":
            self.participants = data["participants"]
            random.shuffle(self.participants)
            self.current_round = 1
            self.tournament = data["name"]
            self.matches = [
                { "player1": self.participants[0], "player2": self.participants[1] },
                { "player1": self.participants[2], "player2": self.participants[3] }
            ]
            await self.restart_game()

            await self.send(json.dumps({
                "type": "joined",
                "name": self.tournament,
                "matches": self.matches,
                "round": self.current_round,
                "player1": self.player1,
                "player2": self.player2,
                "ball": self.ball,
                "score": self.score,
                "paddle": self.paddle,
                "table" : self.table_config
            }))

        if data["type"] == "countdown":
            await self.restart_game()
            self.is_active = True
            await self.channel_layer.group_send(
                self.group_room,
                {
                    "type": "start",
                    "player1": self.player1,
                    "player2": self.player2,
                    "ball": self.ball,
                    "score": self.score,
                    "paddle": self.paddle,
                }
            )
        
        if data["type"] == "update_paddle":
            self.player1["direction"] = data["player1_Direction"]
            self.player2["direction"] = (data["player2_Direction"] * (-1))

        if data["type"] == "start_game":
            print(self.scope["user"], "start the game play")
            asyncio.create_task(self.start_game())

    async def start(self, event):
        await self.send(text_data=json.dumps({
            "type": "start",
            "player1": self.player1,
            "player2": self.player2,
            "ball": self.ball,
            "score": self.score,
            "paddle": self.paddle,
            "table" : self.table_config
        }))
        print(self.scope["user"], ": sending game stats")



    async def start_game(self):
        while self.is_active:
            #update_paddle paddle
            self.move_paddel(self.player1)
            self.move_paddel(self.player2)
            self.move_ball()
            await self.check_goals()
            if self.score["player1"] >= WINNING_SCORE or self.score["player2"] >= WINNING_SCORE:
                await self.send_game_over()
                break
            await self.send_update()
            await asyncio.sleep(0.016)

    async def send_game_over(self):
        await self.channel_layer.group_send(self.group_room, {
            "type" : "game_over"
        })
    
    async def game_over(self, event):
        if(self.is_active):
            print(f"Round {self.current_round} : ", self.score)

            if self.current_round == 1:
                score = self.score
                winner= self.participants[0] if self.score["player1"] >= WINNING_SCORE else self.participants[1]
                self.matches = [
                    { "player1": self.participants[0], "player2": self.participants[1] , "winner": winner, "scores": [score["player1"], score["player2"]] },
                    { "player1": self.participants[2], "player2": self.participants[3] },
                    { "player1": winner}
                ]
                self.passtMatch.append(self.matches[0])

            elif self.current_round == 2:
                score = self.score
                winner= self.participants[2] if self.score["player1"] >= WINNING_SCORE else self.participants[3]
                self.matches = [
                    { "player1": self.participants[0], "player2": self.participants[1] ,
                     "winner": self.passtMatch[0]["winner"],
                     "scores": [self.passtMatch[0]["scores"][0], self.passtMatch[0]["scores"][1]]
                    },
                    { "player1": self.participants[2], "player2": self.participants[3] , "winner": winner, "scores": [score["player1"], score["player2"]] },
                    { "player1": self.passtMatch[0]["winner"], "player2": winner}
                ]
                self.passtMatch.append(self.matches[1])
            elif self.current_round == 3:
                score = self.score
                winner= self.passtMatch[0]["winner"] if self.score["player1"] >= WINNING_SCORE else self.passtMatch[1]["winner"]
                self.matches = [
                    { "player1": self.participants[0], "player2": self.participants[1] ,
                     "winner": self.passtMatch[0]["winner"],
                     "scores": [self.passtMatch[0]["scores"][0], self.passtMatch[0]["scores"][1]]
                    },
                    {
                        "player1": self.participants[2], "player2": self.participants[3] ,
                        "winner": self.passtMatch[1]["winner"],
                        "scores": [self.passtMatch[1]["scores"][0], self.passtMatch[1]["scores"][1]]
                    },
                    { "player1": self.passtMatch[0]["winner"], "player2": self.passtMatch[1]["winner"], "winner": winner, "scores": [score["player1"], score["player2"]] }
                ]
                self.passtMatch.append(self.matches[2])
            self.current_round += 1
            await self.send(json.dumps({
                "type": "game_over",
                "name": self.tournament,
                "matches": self.matches,
                "round": self.current_round,
            }))
        self.restart_game()
        self.is_active = False

    async def send_update(self):
        await self.send(text_data=json.dumps(
            {
                "type": "update",
                "player1": self.player1,
                "player2": self.player2,
                "ball": self.ball,
                "score": self.score,
            }))


    def move_paddel(self, player):
        player["x"] += player["direction"] * self.speed

        if player["x"] < -(TABLE_WIDTH / 2) + (self.paddle["width"] / 2) + 1:
            player["x"] = -(TABLE_WIDTH / 2) + (self.paddle["width"] / 2 ) + 1
        if player["x"] > (TABLE_WIDTH / 2) - (self.paddle["width"] / 2) - 1:
            player["x"] = (TABLE_WIDTH / 2) - (self.paddle["width"]  / 2) - 1

    async def check_goals(self):
        # print(self.role , ": was here")
        if self.ball["z"] + self.ball["radius"] >= (TABLE_HIEGHT / 2):
            await self.reset_ball("player2")
        elif self.ball["z"] - self.ball["radius"] <= -(TABLE_HIEGHT / 2):
            await self.reset_ball("player1")

    async def reset_ball(self, player):
        dx = 1 if random.randint(0,1) > 0.5 else -1
        dz = 1 if random.randint(0,1) > 0.5 else -1

        await self.channel_layer.group_send(self.group_room, {
            "type" : "goal",
            "who" : player,
            "dx": dx,
            "dz": dz
        })
    
    async def goal(self, event):
        self.score[event["who"]] += 1
        self.ball["x"] = 0
        self.ball["z"] = 0
        self.ball["dx"] = BALL_SPEED * event["dx"]
        self.ball["dz"] = BALL_SPEED * event["dz"]

        await self.send(text_data=json.dumps({
            "type" : "goal",
            "player1": self.player1,
            "player2": self.player2,
            "ball": self.ball,
            "score": self.score
        }))


    def move_ball(self):
        self.ball["x"] += self.ball["dx"]
        self.ball["z"] += self.ball["dz"]


        WALL_DAMPENING = 1
        if self.ball["x"] - self.ball["radius"] <= -(TABLE_WIDTH / 2) + 1 or self.ball["x"] + self.ball["radius"] >= (TABLE_WIDTH / 2) - 1:
            self.ball["dx"] *= -WALL_DAMPENING

                 # check for paddle and ball collision  PLAYER 1
        if (self.ball["z"] + self.ball["radius"] >= self.player1['z'] - (self.paddle["deep"] / 2)
            and self.player1["x"] - (self.paddle["width"] / 2) <= self.ball["x"] <= self.player1["x"] + (self.paddle["width"] / 2)):
            #check for left paddle corner
            if self.ball["x"] < (self.player1["x"] - (self.paddle["width"] / 2)) + (self.paddle["width"] / 10):
                self.ball["dx"] *= -1 if self.ball["dx"] > 0 else 1 #Bounce the ball back
            
            #check for right paddle corner
            elif self.ball["x"] > (self.player1["x"] + (self.paddle["width"] / 2)) - (self.paddle["width"] / 10):
                self.ball["dx"] *= -1 if self.ball["dz"] < 0 else  1 #Bounce the ball back
            
            self.ball["dz"] *= -1
            self.ball["dz"] *= 1.05 # Ball speed increase after hit
            # velocity.x += (keys.ArrowLeft ? -0.5 : 0) * playerSpeed;
            # velocity.x += (keys.ArrowRight ? 0.5 : 0) * playerSpeed;
            self.ball["dx"] += ( 0.5 if self.player1["direction"] == 1 else 0) * self.speed
            self.ball["dx"] += (-0.5 if self.player1["direction"] == -1 else 0) * self.speed

                 # check for paddle and ball collision  PLAYER 2
        if (self.ball["z"] - self.ball["radius"] <= self.player2['z'] +  (self.paddle["deep"] / 2)
            and self.player2["x"] - (self.paddle["width"] / 2) <= self.ball["x"] <= self.player2["x"] + (self.paddle["width"] / 2)):
            #check for left paddle corner
            if self.ball["x"] < (self.player2["x"] - (self.paddle["width"] / 2)) + (self.paddle["width"] / 10):
                self.ball["dx"] *= -1 if self.ball["dx"] > 0 else 1 #Bounce the ball back
            
            #check for right paddle corner
            elif self.ball["x"] > (self.player2["x"] + (self.paddle["width"] / 2)) - (self.paddle["width"] / 10):
                self.ball["dx"] *= -1 if self.ball["dz"] < 0 else  1 #Bounce the ball back
            
            self.ball["dz"] *= -1
            # self.ball["dx"] *= 1.05 # Ball speed increase after hit
            self.ball["dx"] += ( 0.5 if self.player2["direction"] == 1 else 0) * self.speed
            self.ball["dx"] += (-0.5 if self.player2["direction"] == -1 else 0) * self.speed
        



    async def restart_game(self):

        self.paddle["height"] = 0.5  # Dynamic height based on screen size
        self.paddle["width"] = 5  # Dynamic width based on screen size
        self.paddle["deep"] = 0.5
        ball_radius = 0.5  # Dynamic ball radius
        self.speed = 0.5
        self.ball_dx = BALL_SPEED  # Adjust ball speed according to width
        self.ball_dz = BALL_SPEED  # Adjust ball speed according to height

        self.table_config = {
            "tableWidth": TABLE_WIDTH,  # Use actual values
            "tableHeight": TABLE_HIEGHT,
        }

        self.player1 = {
            "x": 0,
            "y": 0.1,
            "z": (TABLE_HIEGHT / 2),
            "direction": 0
        }

        self.player2 = {
            "x": 0,
            "y": 0.1,
            "z": -(TABLE_HIEGHT / 2),
            "direction": 0
        }

        self.ball = {
            "x" : 0,
            "y" : 0.1,
            "z" : 0,
            "dx": self.ball_dx if random.randint(0, 1) > 0.5 else -self.ball_dx,
            "dz": self.ball_dz if random.randint(0, 1) > 0.5 else -self.ball_dz,
            "radius": ball_radius
        }

        self.score = {
            "player1": 0,
            "player2": 0
        }

