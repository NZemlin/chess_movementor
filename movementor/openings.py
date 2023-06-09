from flask import (
    Blueprint, flash, g, redirect, render_template, render_template_string, request, url_for
)
from werkzeug.exceptions import abort

from movementor.auth import login_required

from .scrape_and_parse import p

bp = Blueprint('openings', __name__)

@bp.route('/')
def index():
    return render_template('openings/index.html', openings = p.parsed_dict)

@bp.route('/<string:name>/view', methods=('GET', 'POST'))
@login_required
def view(name):
    if request.method == 'POST':
        return redirect(url_for('openings.index'))
    
    return render_template_string(p.write_html(name))

@bp.route('/<string:name>/practice', methods=('GET', 'POST'))
@login_required
def practice(name):
    opening = p.parsed_dict[name]
    if request.method == 'POST':
        return redirect(url_for('openings.index'))

    return render_template_string('Coming Soon', opening = opening)