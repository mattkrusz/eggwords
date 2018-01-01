from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from django.conf import settings
import os.path


class Game(View):
    def get(self, request, *args, **kwargs):
        try:
            with open(os.path.join(settings.REACT_APP_DIR, 'build', 'index.html')) as f:
                return HttpResponse(f.read())
        except FileNotFoundError:
            return HttpResponse(
                """
                This URL is only used when you have built the production
                version of the app. Visit http://localhost:3000/ instead, or
                run `yarn run build` to test the production version.
                """,
                status=501,
            )
