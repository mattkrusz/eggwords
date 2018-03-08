# Eggwords

Eggwords is a multiplayer word-unscrambling game designed to let you easily challenge a friend. The backend is a Python 3 app built with Django Channels and Redis, and the frontend is React/Redux. 

Give it a try at [www.eggwords.com](https://www.eggwords.com)!

<img src="screenshots/demo.gif" height=200px />

## Setting Up Development Environment

### Backend (Django Channels / Redis):

1. Start redis. The app requires redis to be running on port 6379. If you have docker, you can start redis using the docker-compose file at `docker/docker-compose.yml`.

2. Install python dependencies, using requirements.txt or the Pipfile using pipenv.

3. Run Django migrations and set up the words database

3. Start the Django Channels Backend. Django Channels requires starting a few processes that work together.

```bash
pipenv install
cd eggwords

# Migrate the sqlite database
python manage.py migrate --settings=eggwords.settings.dev_settings

# Load words
python manage.py load_words --settings=eggwords.settings.dev_settings

# Start the Django Channels version of runserver
python manage.py runserver --settings=eggwords.settings.dev_settings

# Start the Django Channels delay worker
python manage.py rundelay --settings=eggwords.settings.dev_settings

```  

### Frontend (React / Redux)

1. Install dependencies using npm
2. Use `npm start` to start the hot-reloading development server (it is configured to proxy requests to the development backend above).

```bash
cd frontend
npm install
npm start
```