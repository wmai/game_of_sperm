# Game of Sperm

Population reproduction simulator inspired by the Paper.js “tadpoles” example.

## Bootstrapping

``` shell
# Clone the repository
git clone https://github.com/wmai/game_of_sperm.git
cd game_of_sperm

# Install JavaScript dependencies
cd app/static/js
npm install

# Setup virtualenv (for Mac OS X. For other systems, see : http://flask.pocoo.org/docs/0.12/installation/)
cd ../../../
sudo pip install virtualenv
virtualenv venv
. venv/bin/activate

# Install Flask
pip install Flask

# Run the flask server
FLASK_APP=app/app.py FLASK_DEBUG=1 flask run
```

## Screenshots

![capture 0](https://github.com/wmai/game_of_sperm/blob/master/examples/capture_0.png)
![capture 1](https://github.com/wmai/game_of_sperm/blob/master/examples/capture_1.png)
![capture 2](https://github.com/wmai/game_of_sperm/blob/master/examples/capture_2.png)
