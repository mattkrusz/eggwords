from django.shortcuts import render
from django.http import HttpResponse
from django.views import View

class ChatDemo(View):
    def get(self, request, *args, **kwargs):
        return render(request, 'demofrontend/chatdemo.html', {})
