# -*- coding: utf-8 -*-
# @Author: wmai
# @Date:   2017-08-03 15:06:23
# @Last Modified by:   wmai
# @Last Modified time: 2017-10-19 18:35:32
# ========================================
# Run :
# $ FLASK_APP=app/app.py FLASK_DEBUG=1 flask run
# Then go to :
# http://127.0.0.1:5000/

from flask import (Flask, render_template)

app = Flask(__name__)


@app.route('/')
def hello_world():
    return render_template('index.html')
