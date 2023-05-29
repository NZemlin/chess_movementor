from flask import (
    Blueprint, flash, g, redirect, render_template, render_template_string, request, url_for
)
from werkzeug.exceptions import abort

from movementor.auth import login_required

from .scrape_and_parse import parsed_games as pg

from airium import Airium

bp = Blueprint('openings', __name__)

@bp.route('/')
def index():
    return render_template('openings/index.html', openings = pg)

@bp.route('/<string:name>/view', methods=('GET', 'POST'))
@login_required
def view(name):
    opening = pg[name]
    if request.method == 'POST':
        return redirect(url_for('openings.index'))
    html = '''<!doctype html><title>{% block title %}{% endblock %} - MoveMentor</title><link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}"><nav><h1>MoveMentor</h1><ul>{% if g.user %}<li><span>{{ g.user['username'] }}</span><li><a href="{{ url_for('auth.logout') }}">Log Out</a>{% else %}<li><a href="{{ url_for('auth.register') }}">Register</a><li><a href="{{ url_for('auth.login') }}">Log In</a>{% endif %}</ul></nav><section class="content">'''
    html_flashed = '''{% for message in get_flashed_messages() %}<div class="flash">{{ message }}</div>{% endfor %}'''
    a = Airium()
    with a.header():
        with a.h1():
            a(opening['name'])
    html += str(a) + html_flashed
    a = Airium()
    with a.div(klass = 'moves-container'):
        for i, move in enumerate(opening['moves'][0:-1]):
            if move [0] == ' ':
                text = ''
                for j, ch in enumerate(move):
                    if ch == ' 'and j != len(move) - 1:
                        text += '&nbsp;'
                    elif ch == '|':
                        text += '|'
                with a.a():
                    a(text)
            else:
                with a.a(id = i):
                    a(move)
            if move[len(move) - 1::] == '\n':
                a('<br>')
        with a.a(id = len(opening['moves'])- 1):
            a(opening['moves'][-1])
    html += str(a) + "</section>"

    return render_template_string(html, fens = opening['fens'])

@bp.route('/<string:name>/practice', methods=('GET', 'POST'))
@login_required
def practice(name):
    opening = pg[name]
    if request.method == 'POST':
        return redirect(url_for('openings.index'))

    return render_template_string('Coming Soon', opening = opening)