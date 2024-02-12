class PGNWriter():
    def __init__(self, parsed_dict = []):
        self.parsed_dict = parsed_dict
        self.shared = {}
        self.functions = {
            'study': self.study,
            'practice': self.practice,
            'create': self.create,
        }
        
    def print_moves(self, name):
        for move_info in self.parsed_dict[name]:
            print(move_info.space, move_info.move_num_san, end='')

    def populate_shared(self, name, moves, page):
        if page == 'study' or (page == 'practice' and name != 'Free Play'):
            other = 'study' if page == 'practice' else 'practice'
            h1_title = f'{page.capitalize()} the {name}'
            h1_link = f'<a href="/{name}/{other}">{other.capitalize()} the {name}&nbsp;-></a>'
        elif page == 'practice':
            h1_title = f'Play Against Stockfish'
            h1_link = f'<a href="/create">Create an Analysis&nbsp;-></a>'
        else:
            h1_title = 'Create an Analysis'
            h1_link = '<a href="/free_play/practice">Play Against Stockfish&nbsp;-></a>'
        self.shared['header_html'] = f'''
            <div class="container">
                <div class="row">
                    <div class="col">
                        <h1>{h1_title}</h1>
                    </div>
                    <div class="col">
                        <h1>{h1_link}</h1>
                    </div>
                </div>
            </div>
            '''
        start_position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1'
        hidden_move_class = 'played-selected' if page == 'practice' else 'selected'
        child = moves[0].fen_dict['own'] if moves else ''
        self.shared['hidden_move'] = f'''
            <span hidden id="-1"
                data-fen={start_position}
                data-own={start_position}
                data-parent={start_position}
                data-child-1={child}
                data-child-2={child}
                class="move {hidden_move_class}">
            </span>
        '''
        self.shared['eval_bar'] = '''
            <div class="empty-row"></div>
            <div id="evalBar">
                <div class="eval-pop-up"></div>
                <div class="evalNum evalNumOpp"></div>
                <div class="blackBar" style="height:50%;"></div>
                <div class="zero"></div>
                <div class="evalNum evalNumOwn"></div>
            </div>
        '''
        self.shared['captured_canvases_and_board'] = '''
            <div class="row board-container">
                <div class="row captured-opp"></div>
                <div id="board_wrapper" class="row">
                    <canvas style="pointer-events:none;" id="arrow_canvas" width="700" height="676"></canvas>
                    <canvas style="pointer-events:none;" id="dot_and_circle_canvas" width="700" height="676"></canvas>
                    <div id="myBoard" class="board"></div>
                </div>
                <div class="row captured-own"></div>
            </div>
        '''
        self.shared['lines_table'] = '''
            <table class="lines-table table">
                <tbody>
                    <tr>
                        <th scope="row" class="eval1"></th>
                        <td class="line1"></td>
                    </tr>
                    <tr>
                        <th scope="row" class="eval2"></th>
                        <td class="line2"></td>
                    </tr>
                    <tr>
                        <th scope="row" class="eval3"></th>
                        <td class="line3"></td>
                    </tr>
                </tbody>
            </table>
        '''
        self.shared['status'] = '''
            <div class="row">
                <h2 id="status"></h2>
            </div>
        '''
        copy_button = 'PGN' if page == 'practice' else 'FEN'
        self.shared['shared_buttons'] = f'''
            <div class="empty-row">
                <button id="evalBarBtn" class="ignore">Hide Eval</button>
                <button id="lineBtn" class="ignore">Hide Lines</button>
                <button id="copyBtn">Copy {copy_button}</button>
                <button id="swapBtn" class="ignore">Swap</button>
                <button id="restartBtn">Restart</button>
            </div>
        '''

    def study(self, name, moves, page):
        modal = '''
            <div id="myModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Study Your Opening!</h2>
                        <span id="close" class="close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <h3>This page is used to visualize the branching of your lines and lets you traverse them with ease</h3>
                        <p>The current move that you're on will be highlighted</p>
                        <p>The right arrow key takes you to the next mainline move of the current variation you're on</p>
                        <p>The down arrow key takes you through the list of sidelines (if any) that branch off the move that you're on</p>
                        <p>The up and left arrow keys take you to the previous move of the current variation that you're on</p>
                        <p>The spacebar key takes you to the nearest previous move that started a variation of was part of the mainline</p>
                        <p>You can also click on the moves to take you directly to that FEN</p>
                        <p>Clicking and dragging the pieces to make the moves are limited to what's in your preparation until the end of the line</p>
                        <p>When you reach the end of the line, you can then play any move and go off of your preparation</p>
                        <p>The various buttons on the page are pretty self explanatory</p>
                        <p>Enjoy studying!</p>
                    </div>
                </div>
            </div>
        '''
        comment = '''
            <div class="row">
                <p id="comment" style="margin-bottom:6.5px;">Comment:</p>
            </div>
        '''
        study_moves = f'''
            <div class="row moves-container-study">
                {self.shared['hidden_move']}
                <span class="moves-line">
        '''
        line_num = 0
        for i, move_info in enumerate(moves):
            dark = ' dark-row' if (line_num % 2 == 0) else ''
            if move_info.space:
                study_moves += f'''<span> {move_info.space.replace(' ', '&nbsp;')} </span>'''
            if move_info.move_turn():
                study_moves += f'''<span>{move_info.move_turn()}&nbsp;</span>'''
            study_moves += self.move_element(move_info, i, 'study')
            if move_info.new_line:
                line_num += 1
                study_moves += f'''</span><span class="moves-line{dark}">'''
            else:
                study_moves += f'''<span> &nbsp; </span>'''
        return f'''
                {modal}
                <div hidden id="page" data-page={page}></div>
                    <div class="container">
                        <div class="row">
                            <div class="eval-col">
                                {self.shared['eval_bar']}
                            </div>
                            <div class="board-col">
                                {self.shared['captured_canvases_and_board']}
                            </div>
                            <div class="moves-col">
                                {self.shared['shared_buttons']}
                                {self.shared['lines_table']}
                                {self.shared['status']}
                                {comment}
                                {study_moves}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        '''
    
    def practice(self, name, moves, page):
        if name != 'Free Play':
            modal_header = 'Practice Your Opening!'
            modal_body = '''
                <h3>This page acts as your personal sparring partner for a particular opening you want to practice</h3>
                <p>The opponent will only pick moves out of the preparation that you gave it</p>
                <p>It will also only allow you to make moves that are included in your preparation</p>
                <p>You can turn hints on or off to tell you what moves are allowed (based on your preparation) in the given position</p>
                <p>Click different line to force the opponent to pick a different available move (if there is one)</p>
                <p>Traversing the already played moves is just with the left and right arrow keys, or by clicking them</p>
                <p>When you reach the end of your preparation in whatever line was played, the option to continue the game pops up</p>
                <p>Choose the difficulty that you'd like the engine to play at (from 0-20) if you want to continue</p>
                <p>Turning Blitz Mode on will restart the game for you as soon as you reach the end of whatever line was played</p>
                <p>Otherwise, click restart go again</p>
                <p>Enjoy practicing!</p>
            '''
        else:
            modal_header = 'Play Against Stockfish!'
            modal_body = '''
                <h3>Don't want to practice a particular opening?  Play against Stockfish from the get go instead</h3>
                <p>Choose the difficulty that you'd like the engine to play at (from 0-20)</p>
                <p>The opponent will pick a move based on the strength you assign it, analyzing up to a depth of 10</p>
                <p>Traversing the already played moves is just with the left and right arrow keys, or by clicking them</p>
                <p>Enjoy practicing!</p>
            '''
        modal = f'''
            <div id="myModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>{modal_header}</h2>
                        <span id="close" class="close">&times;</span>
                    </div>
                    <div class="modal-body">
                        {modal_body}
                    </div>
                </div>
            </div>
        '''
        practice_buttons = '''
            <div class="empty-row practice-buttons">
                <button id="blitzBtn">Blitz: Off</button>
                <button id="difLineBtn">Other Line</button>
                <button id="limitLineBtn">Limit Line</button>
                <button id="hintBtn" class="ignore">Hide Hints</button>
                <span id="hints" class="text-wrap">No hints currently</span>
            </div>
        '''
        hidden_moves = f'''
            <div class="row moves-container-practice">
            {self.shared['hidden_move']}
        '''
        for i, move_info in enumerate(moves):
            hidden_moves += self.move_element(move_info, i, 'practice')
        hidden_moves += '</div>'
        practice_moves = f'''
            <div class="row move-list-container" style="height:532px;">
        '''
        for i in range(1, 301):
            practice_moves += f'''
                <div class="row">
                    <div hidden id="n{str(i)}" class="col-2 move-list-num">
                        {str(i)}.
                    </div>
                    <div class="col-5">
                        <span id="w{str(i)}"
                            class="move-list played-move ignore"
                            data-own=""
                            data-fen=""
                            data-source=""
                            data-target= ""
                            data-prev-move=b{str(i-1)}
                            data-next-move=b{str(i)}
                            data-eval=""
                            style="visibility:hidden";>
                        </span>
                    </div>
                    <div class="col-5">
                        <span id="b{str(i)}"
                            class="move-list played-move ignore"
                            data-fen=""
                            data-source=""
                            data-target= ""
                            data-prev-move=w{str(i)}
                            data-next-move=w{str(i+1)}
                            data-eval=""
                            style="visibility:hidden";>
                        </span>
                    </div>
                </div>
            '''
        practice_moves += '</div>'
        keep_playing_button = '''
            <div class="row">
                <label id="skill-label">Skill (0-20):
                    <input type="number" id="skill-input" name="skill" min="0" max="20" value="0" style="margin-top:6.5px;margin-bottom:0px;">
                </label>
                <button id="keepPlayingBtn">Continue Playing</button>
            </div>
        '''
        return f'''
                {modal}
                <div hidden id="page" data-page={page}></div>
                    <div class="container">
                        <div class="row">
                            <div class="eval-col">
                                {self.shared['eval_bar']}
                            </div>
                            <div class="board-col">
                                {self.shared['captured_canvases_and_board']}
                                {hidden_moves}
                            </div>
                            <div class="moves-col">
                                {self.shared['shared_buttons']}
                                {practice_buttons}
                                {self.shared['lines_table']}
                                {self.shared['status']}
                                <div class="row">
                                    <div class="col-5">
                                        {practice_moves}
                                    </div>
                                    <div class="col-2" style="text-align:center;">
                                        {keep_playing_button}
                                    </div>
                                    <div class="col-5"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        '''
    
    def create(self, name, moves, page):
        modal = '''
            <div id="myModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2></h2>
                        <span id="close" class="close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <h3></h3>
                        <p></p>
                    </div>
                </div>
            </div>
        '''
        comment = '''
            <div style="flex-direction:row;">
                <label for="comment" style="margin-bottom:6.5px;">Comment:&nbsp;</label>
                <input type="textarea" id="comment" name="comment">
                <button id="commentBtn">Save</button>
            </div>
        '''
        create_moves = f'''
            <div class="row moves-container-study">
                {self.shared['hidden_move']}
        '''
        return f'''
                {modal}
                <div hidden id="page" data-page={page}></div>
                    <div class="container">
                        <div class="row">
                            <div class="eval-col">
                                {self.shared['eval_bar']}
                            </div>
                            <div class="board-col">
                                {self.shared['captured_canvases_and_board']}
                            </div>
                            <div class="moves-col">
                                {self.shared['shared_buttons']}
                                {self.shared['lines_table']}
                                {self.shared['status']}
                                {comment}
                                {create_moves}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        '''

    def move_element(self, move, id, page):
        return f'''<span {('hidden' if page == 'practice' else '')}
                       id={str(id)}
                       data-own={move.fen_dict['own']}
                       data-parent={move.fen_dict['parent']}
                       data-child-1={move.fen_dict['child_1']}
                       data-child-2={move.fen_dict['child_2']}
                       data-mainline={str(move.move.is_mainline()).lower()}
                       data-variation-start={str(move.move.starts_variation()).lower()}
                       data-san={move.move.san()}
                       data-uci={move.move.uci()}
                       data-ep={str(move.ep).lower()}
                       data-color={('white' if not move.move.turn() else 'black')}
                       data-turn={move.turn_number()}
                       data-comment={move.comment}
                       class="move ignore">{move.move.san()}
                   </span>
                '''
    
    def write_html(self, name, moves, page):
        self.populate_shared(name, moves, page)
        return '''
            {% extends "openings/chess.html" %}

            {% block header %} ''' + self.shared['header_html'] + ''' {% endblock %}

            {% block content %} ''' + self.functions[page](name, moves, page) + ''' {% endblock %}
            '''