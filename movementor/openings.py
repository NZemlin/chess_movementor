from flask import (
    Blueprint, flash, g, redirect, render_template, render_template_string, request, url_for, send_file, make_response
)
from werkzeug.exceptions import abort

from movementor.auth import login_required
from movementor.db import get_db

import io
import chess.pgn

from .utils.parse import PGNParser
from .utils.write import PGNWriter

bp = Blueprint('openings', __name__)
writer = PGNWriter()

def get_opening(name, check_author=True):
    opening = get_db().execute(
        'SELECT o.title, pgn, author_id'
        ' FROM opening o'
        ' WHERE o.title = ?'
        ' AND author_id = ?',
        (name, g.user['id'],)
    ).fetchone()

    if opening is None:
        abort(404, f"Opening {name} doesn't exist.")

    if check_author and opening['author_id'] != g.user['id']:
        abort(403)

    return opening

def parse_and_write_pgn(name, pgn, page):
    if pgn:
        parser = PGNParser(chess.pgn.read_game(io.StringIO(pgn)), [])
        return writer.write_html(name, parser.move_list, page)
    else:
        return writer.write_html(name, [], page)

@bp.route('/', methods=('GET', 'POST',))
@login_required
def index():
    if request.method == 'POST':
        title = request.form['name']
        pgn = request.form['pgn']
        error = ''

        if not title:
            error += 'Name is required.'
            
        if not pgn:
            error += 'PGN is required.'

        game = chess.pgn.read_game(io.StringIO(pgn))

        for err in game.errors:
            error += err

        if not game.variations:
            error += 'Please enter a correct PGN.'

        if error:
            flash(error)
        else:
            db = get_db()
            db.execute(
                'INSERT INTO opening (title, pgn, author_id)'
                ' VALUES (?, ?, ?)',
                (title, pgn.replace('\n', ' '), g.user['id'])
            )
            db.commit()
            return redirect(url_for('openings.index'))
        
    db = get_db()
    openings = db.execute(
        'SELECT o.title, author_id'
        ' FROM opening o'
        ' WHERE author_id = ?'
        ' ORDER BY created DESC',
        (g.user['id'],)
    ).fetchall()

    return render_template('openings/index.html', openings = openings)

@bp.route('/<string:name>/delete', methods=('POST',))
@login_required
def delete(name):
    get_opening(name)
    db = get_db()
    db.execute('DELETE FROM opening WHERE title = ?', (name,))
    db.commit()
    return redirect(url_for('openings.index'))

@bp.route('/<string:name>/study', methods=('GET', 'POST'))
@login_required
def study(name):
    if request.method == 'POST':
        return redirect(url_for('openings.index'))
    
    # resp = make_response(render_template_string(p.writer.write_html(name, 'study')))
    # resp.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    # resp.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    # return resp

    opening = get_opening(name)

    return render_template_string(parse_and_write_pgn(opening['title'], opening['pgn'], 'study'))

@bp.route('/<string:name>/practice', methods=('GET', 'POST'))
@login_required
def practice(name):
    if request.method == 'POST':
        return redirect(url_for('openings.index'))

    # resp = make_response(render_template_string(p.writer.write_html(name, 'practice')))
    # resp.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    # resp.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    # return resp
    if name == 'free_play':
        name = 'Free Play'
    opening = get_opening(name)

    return render_template_string(parse_and_write_pgn(opening['title'], opening['pgn'], 'practice'))

@bp.route('/create_analysis', methods=('GET', 'POST'))
@login_required
def create_analysis():
    if request.method == 'POST':
        return redirect(url_for('openings.index'))
    
    # resp = make_response(render_template_string(p.writer.write_html(name, 'study')))
    # resp.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    # resp.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    # return resp

    return render_template_string(parse_and_write_pgn('', '', 'create'))

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