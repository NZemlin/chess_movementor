import functools

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)
from werkzeug.security import check_password_hash, generate_password_hash

from movementor.db import get_db, init_db

bp = Blueprint('auth', __name__, url_prefix='/auth')

@bp.route('/register', methods=('GET', 'POST'))
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        db = get_db()
        db_exists = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user';").fetchall()
        if not db_exists:
            init_db()
            db = get_db()
        error = None

        if not username:
            error = 'Username is required.'
        elif not password:
            error = 'Password is required.'

        if error is None:
            try:
                db.execute(
                    "INSERT INTO user (username, password) VALUES (?, ?)",
                    (username, generate_password_hash(password)),
                )
                db.commit()
            except db.IntegrityError:
                error = f"User {username} is already registered."
            else:
                user = db.execute(
                    'SELECT * FROM user WHERE username = ?', (username,)
                ).fetchone()
                title = 'Example: Latvian Gambit'
                pgn = '''1. e4 e5 2. Nf3 f5 3. Nxe5 (3. d4 fxe4 4. Nxe5 Nf6 5. Be2 d6 6. Ng4 Be7 7. Nxf6+
                         Bxf6 8. c4 O-O 9. O-O) (3. exf5 e4 4. Nd4 Nf6 5. d3 c5 6. Nb5 a6 7. N5c3 exd3 8.
                         Bxd3 d5) 3... Qf6 (3... Nf6 4. Bc4 Qe7 5. d4 Nc6 6. O-O Nxe5 7. dxe5 Qxe5 8.
                         exf5 Qxf5 9. Nc3) (3... Nc6 4. Qh5+ g6 (4... Ke7 5. Qf7+ Kd6 6. Nc4+ Kc5 7. Qd5+
                         Kb4 8. a3+ Ka4 9. b3#) 5. Nxg6 Nf6 (5... hxg6 6. Qxh8) 6. Qh4 Rg8 7. Nxf8) 4. d4
                         d6 (4... Nc6 5. Nc3 Nxe5 6. Nd5 Qd8 7. dxe5 fxe4 8. Bg5 Be7 9. Nxe7 Nxe7 10.
                         Qh5+ g6 11. Qh4) (4... fxe4 5. Bc4 d6 6. Nf7) 5. Nc4 fxe4 6. Nc3 Qg6 (6... Nc6
                         7. d5) (6... Ne7 7. Ne3) (6... Be7 7. Nd5 Qf5 8. Nxc7+) (6... Bd7 7. Nd5 Qd8 8.
                         Qe2 Nf6 9. Bg5) 7. Bf4 Nf6 8. Ne3 (8. Qd2 Be7 9. O-O-O O-O 10. f3 exf3 11. gxf3
                         Nc6 12. Ne3 Nh5 13. Bc4+ Kh8 14. Rhg1 Qe8 15. Bg5 Bxg5 16. Rxg5 Nf4 17. Ng2 Nxg2
                         18. Rxg2 Rxf3 19. Rdg1) 8... Be7 9. h4 O-O 10. h5 Qf7 11. h6 g6 12. Bc4 Be6 *
                      '''
                db.execute(
                    'INSERT INTO opening (title, pgn, author_id)'
                    ' VALUES (?, ?, ?)',
                    (title, pgn, user['id'])
                )
                db.commit()
                return redirect(url_for("auth.login"))

        flash(error)

    return render_template('auth/register.html')

@bp.route('/login', methods=('GET', 'POST'))
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        db = get_db()
        error = None
        user = db.execute(
            'SELECT * FROM user WHERE username = ?', (username,)
        ).fetchone()

        if user is None:
            error = 'Incorrect username.'
        elif not check_password_hash(user['password'], password):
            error = 'Incorrect password.'

        if error is None:
            session.clear()
            session['user_id'] = user['id']
            return redirect(url_for('index'))

        flash(error)

    return render_template('auth/login.html')

@bp.before_app_request
def load_logged_in_user():
    db = get_db()
    db_exists = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user';").fetchall()
    if not db_exists:
        init_db()
        return render_template('auth/register.html')
    user_id = session.get('user_id')

    if user_id is None:
        g.user = None
    else:
        g.user = get_db().execute(
            'SELECT * FROM user WHERE id = ?', (user_id,)
        ).fetchone()

@bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for('auth.login'))

        return view(**kwargs)

    return wrapped_view