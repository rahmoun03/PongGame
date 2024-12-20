from django.db import models
from django.contrib.auth.models import User

from django.db import models

class Participant(models.Model):
    alias = models.CharField(max_length=100, unique=True)  # Alias username
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp for when the participant was created

    def __str__(self):
        return self.alias


class Tournament(models.Model):
    name = models.CharField(max_length=100, unique=True)  # Tournament name
    creator = models.CharField(max_length=100)  # User who created the tournament
    creator_username = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_tournaments"
    )  # User who created the tournament
    participants = models.ManyToManyField(Participant, related_name="joined_tournaments", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp of creation
    updated_at = models.DateTimeField(auto_now=True)  # Timestamp of last update
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("active", "Active"),
            ("completed", "Completed"),
        ],
        default="pending",
    )  # Status of the tournament
    max_participants = models.PositiveIntegerField(default=8)  # Optional: max participants

    def __str__(self):
        return f"{self.name} (Created by: {self.creator})"

    def add_participant(self, user):
        """Add a participant to the tournament if there's space."""
        if not self.is_full():
            self.participants.add(user)
        else:
            raise ValueError("Tournament is full!")

    def is_full(self):
        """Check if the tournament is full."""
        return self.participants.count() >= self.max_participants
