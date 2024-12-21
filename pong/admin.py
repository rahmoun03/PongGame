from django.contrib import admin
from .models import Tournament
from .models import Participant

@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')

@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('alias', 'created_at')
    list_filter = ('created_at',)