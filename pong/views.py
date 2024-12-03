from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.contrib.auth.decorators import login_required


@login_required
def index(request):
    return render(request, 'index.html')  # Simpler and clearer


def login_view(request):
    if request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('index')  # Ensure 'index' matches the name in urls.py
        else:
            messages.error(request, "Invalid username or password")
    return render(request, 'login.html')  # Ensure this template exists
