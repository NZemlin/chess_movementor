from flask import (
    Blueprint, flash, g, redirect, render_template, render_template_string, request, url_for, send_file
)
from werkzeug.exceptions import abort

from movementor.auth import login_required

from .scrape import p

bp = Blueprint('openings', __name__)

@bp.route('/')
def index():
    return render_template('openings/index.html', openings = p.parsed_dict)

@bp.route('/<string:name>/study', methods=('GET', 'POST'))
@login_required
def study(name):
    if request.method == 'POST':
        return redirect(url_for('openings.index'))
    
    return render_template_string(p.writer.write_html(name, 'study'))

@bp.route('/<string:name>/practice', methods=('GET', 'POST'))
@login_required
def practice(name):
    if request.method == 'POST':
        return redirect(url_for('openings.index'))

    return render_template_string(p.writer.write_html(name, 'practice'))

@bp.route('/<string:name>/static/img/chesspieces/wikipedia/<string:image>', methods=('GET', 'POST'))
@login_required
def pic(name, image):
    if request.method == 'POST':
        return redirect(url_for('openings.index'))
    
    return send_file('./static/img/chesspieces/wikipedia/' + image, mimetype='image/png')

@bp.route('/<string:name>/static/audio/<string:audio>', methods=('GET', 'POST'))
@login_required
def sound(name, audio):
    if request.method == 'POST':
        return redirect(url_for('openings.index'))
    
    return send_file('./static/audio/' + audio, mimetype='audio/mp3')