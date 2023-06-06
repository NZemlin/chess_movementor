from flask import (
    Blueprint, flash, g, redirect, render_template, render_template_string, request, url_for
)
from werkzeug.exceptions import abort

from movementor.auth import login_required

from .scrape_and_parse import parsed_games as pg, uci_to_move, create_fen_dict, move_turn

bp = Blueprint('openings', __name__)

@bp.route('/')
def index():
    return render_template('openings/index.html', openings = pg)

@bp.route('/<string:name>/view', methods=('GET', 'POST'))
@login_required
def view(name):
    moves = pg[name]
    if request.method == 'POST':
        return redirect(url_for('openings.index'))
    html = '''
    <!doctype html>
    <title>
        {% block title %}{% endblock %}MoveMentor
    </title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
    <script type="text/javascript" src="{{ url_for('static', filename='openings.js')}}"></script>
    <nav>
        <h1>MoveMentor</h1>
        <ul>
            {% if g.user %}
                <li>
                    <span>{{ g.user['username'] }}</span>
                <li>
                <a href="{{ url_for('auth.logout') }}">Log Out</a>
            {% else %}
                <li>
                    <a href="{{ url_for('auth.register') }}">Register</a>
                <li>
                <a href="{{ url_for('auth.login') }}">Log In</a>
            {% endif %}
        </ul>
    </nav>
    <section class="content">
    '''
    html_flashed = '''{% for message in get_flashed_messages() %}<div class="flash">{{ message }}</div>{% endfor %}'''

    html += '''<header><h1>''' + name + '''</h1></header>''' + html_flashed + '''<div class='moves-container'>'''
    pos = 0
    while pos < len(moves):
        html += '''<span class = 'moves-line'>'''
        for m in moves[pos:]:
            move = uci_to_move(m[0])
            if move[0] == ' ':
                text = ''
                for ch in move:
                    if ch == ' ':
                        text += '&nbsp;'
                    elif ch == '|':
                        text += '|'
                html += '''<span> ''' + text + ''' </span>'''
            else:
                d = create_fen_dict(m)
                if not move[0].isnumeric():
                    html += '''<span id = ''' + str(pos) + ''' data-own = ''' + d['own']
                    if d['parent']:
                        html += ''' data-parent = ''' + d['parent']
                    if d['child_1']: 
                        html += ''' data-child-1 = ''' + d['child_1']
                    if d['child_2']:
                        html += ''' data-child-2 = ''' + d['child_2']
                    html += ''' class = 'move' onClick = "click_update(this)"> ''' + move + ''' </span>'''
                else:
                    turn = move_turn(m[0][0], m[0][3], True)
                    html += '''<span>''' + turn[0:len(turn) - 1] + '''&nbsp;</span>'''
                    html += '''<span id = ''' + str(pos) + ''' data-own = ''' + d['own']
                    if d['parent']:
                        html += ''' data-parent = ''' + d['parent']
                    if d['child_1']: 
                        html += ''' data-child-1 = ''' + d['child_1']
                    if d['child_2']:
                        html += ''' data-child-2 = ''' + d['child_2']
                    html += ''' class = 'move' onClick = "click_update(this)"> ''' + move[len(str(turn)):] + ''' </span>'''
                if move[len(move) - 1::] == '\n':
                    pos += 1
                    break
                else:
                    html += '''<span> &nbsp; </span>'''
            pos += 1
        html += '''</span>'''
    html += '''</div></section>'''

    return render_template_string(html)

@bp.route('/<string:name>/practice', methods=('GET', 'POST'))
@login_required
def practice(name):
    opening = pg[name]
    if request.method == 'POST':
        return redirect(url_for('openings.index'))

    return render_template_string('Coming Soon', opening = opening)