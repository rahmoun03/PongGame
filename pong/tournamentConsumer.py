from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.apps import apps
import json

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


class matchmaking(AsyncWebsocketConsumer):
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
            self.room_group_name = data["name"]
            self.alias = data["alias"]
            self.participants = await self.get_participants(self.tournament)
            
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.channel_layer.group_send(self.room_group_name, {
                "type": "update",
                "participants": self.participants
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
    