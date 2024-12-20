from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.apps import apps
import json



# from .models import Tournament #importing the Tournament model

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
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "error",
                    "message": "Tournament name already exists."
                })
            else:
                tournament = await self.create_tournament(data)
                tournament.save()
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "created",
                    "name": tournament.name,
                    "creator": tournament.creator
                })
        #join tournament
        if data["type"] == "join":
            exists = await self.check_tournament_exists(data["name"])
            if exists:
                tournament = await self.get_tournament(data["name"])
                if tournament.is_full():
                    await self.channel_layer.group_send(self.room_group_name, {
                        "type": "error",
                        "message": "Tournament is full."
                    })
                    return
                Participant = apps.get_model('pong', 'Participant')
                participant = Participant.objects.create(alias=data["player"])
                participant.save()
                tournament.add_participant(participant)
                tournament.save()
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "joined",
                    "name": tournament.name,
                    "player": participant.alias
                })
            else:
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "error",
                    "message": "Tournament name already exists."
                })
        
        # delete tournament
        elif data["type"] == "delete":
            success = await self.delete_tournament(data["name"])
            if success:
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "deleted",
                    "name": data["name"]
                })
            else:
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "error",
                    "message": "Tournament not found."
                })

    async def update(self, event):
        await self.send(text_data=json.dumps(event))

    async def error(self, event):
        await self.send(text_data=json.dumps(event))

    async def created(self, event):
        await self.send(text_data=json.dumps(event))

    async def joined(self, event):
        await self.send(text_data=json.dumps(event))

    async def deleted(self, event):
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

        user = User.objects.get(username=data["creator_username"])
        print("USER : ", user)

        return Tournament.objects.create(
            name=data["name"],
            creator=data["creator"],
            creator_username=user,
        )

    @database_sync_to_async
    def delete_tournament(self, name):
        Tournament = apps.get_model('pong', 'Tournament')
        try:
            tournament = Tournament.objects.get(name=name)
            tournament.delete()
            return True
        except Tournament.DoesNotExist:
            return False