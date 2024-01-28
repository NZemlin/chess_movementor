class PGNWriter():
    def __init__(self, parsed_dict = []):
        self.parsed_dict = parsed_dict
        
    def move_element(self, move, i, page):
        return f'''<span {('hidden' if page == 'practice' else '')}
                       id={str(i)}
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
                       class="move ignore">{move.move.san()}
                   </span>
                '''
    
    def write_html_from_move_list(self, name, moves, page):
        start_position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1'
        
        if page == 'study':
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
        else:
            modal = '''
                        <div id="myModal" class="modal">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h2>Practice Your Opening!</h2>
                                    <span id="close" class="close">&times;</span>
                                </div>
                                <div class="modal-body">
                                    <h3>This page acts as your personal sparring partner for a particular opening you want to practice</h3>
                                    <p>The opponent will only pick moves out of the preparation that you gave it</p>
                                    <p>It will also only allow you to make moves that are included in your preparation</p>
                                    <p>You can turn hints on or off to tell you what moves are allowed (based on your preparation) in the given position</p>
                                    <p>Click different line to force the opponent to pick a different available move (if there is one)</p>
                                    <p>Traversing the already played moves is just with the left and right arrow keys, or by clicking them</p>
                                    <p>When you reach the end of your preparation in whatever line was played, the option to continue the game pops up</p>
                                    <p>Choose the difficulty that you'd like the engine to play at (from 0-20) if you want to continue</p>
                                    <p>But if all you're looking for is rapidfire opening practice, then click restart and go again</p>
                                    <p>Enjoy practicing!</p>
                                </div>
                            </div>
                        </div>
                    '''

        other = 'study' if page == 'practice' else 'practice'
        copy_button = 'PGN' if page == 'practice' else 'FEN'
        status = '''
                    <div class="row board-width">
                        <h2 id="status"></h2>
                    </div>
                 '''
        
        hidden_move_class = 'played-selected' if page == 'practice' else 'selected'
        hidden_move = f'''
                        <span hidden id="-1"
                            data-fen={start_position}
                            data-own={start_position}
                            data-parent={start_position}
                            data-child-1={moves[0].fen_dict['own']}
                            data-child-2={moves[0].fen_dict['own']}
                            class="move {hidden_move_class}">
                        </span>
                    '''
        
        shared_buttons = f'''
                            <div class="row empty-row"></div>
                            <div class="row">
                                <button id="copyBtn">Copy {copy_button}</button>
                            </div>
                            <div class="row button-spacer"></div>
                            <div class="row">
                                <button id="swapBtn" class="ignore">Swap</button>
                            </div>
                            <div class="row button-spacer"></div>
                            <div class="row">
                                <button id="restartBtn">Restart</button>
                            </div>
                        '''
        
        practice_buttons = ''' 
                                
                                <div class="row button-spacer"></div>
                                <div class="row">
                                    <button id="difLineBtn">Other Line</button>
                                </div>
                                
                                <div class="row button-spacer"></div>
                                <div class="row">
                                    <button id="hintBtn" class="ignore">Hide Hints</button>
                                </div>
                                <div class="row button-spacer"></div>
                                <div class="row">
                                    <span id="hints" class="text-wrap">No hints currently</span>
                                </div>
                            '''
        
        eval_bar = '''
                    <div class="empty-row"></div>
                    <div id="evalBar">
                        <div class="eval-pop-up"></div>
                        <div class="evalNum evalNumOpp"></div>
                        <div class="blackBar" style="height:50%;"></div>
                        <div class="zero"></div>
                        <div class="evalNum evalNumOwn"></div>
                    </div>
                '''
        
        captured_canvases_and_board = '''
                                <div class="row captured-opp board-width"></div>
                                <div id="board_wrapper" class="row">
                                    <canvas style="pointer-events:none;" id="arrow_canvas" width="700" height="674.17" ></canvas>
                                    <canvas style="pointer-events:none;" id="dot_and_circle_canvas"  width="700" height="674.17" ></canvas>
                                    <div id="myBoard" class="board"></div>
                                </div>
                                <div class="row captured-own board-width"></div>
                            '''
        
        hidden_practice_moves = f'''
                                    <div class="row moves-container-practice">
                                    {hidden_move}
                                '''
        for i, move_info in enumerate(moves):
            hidden_practice_moves += self.move_element(move_info, i, 'practice')
        hidden_practice_moves += '</div>'

        lines_table = '''
                                    <div class="empty-row">
                                        <button id="evalBarBtn" class="ignore">Hide Eval</button>
                                        <button id="lineBtn" class="ignore">Hide Lines</button>
                                    </div>
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
        
        study_lines_status_and_moves = f'''
                                     <div class="col-6">
                                        {lines_table}
                                        {status}
                                        <div class="row moves-container-study">
                                            {hidden_move}
                                            <span class="moves-line">
                                  '''
        line_num = 0
        print(moves)
        for i, move_info in enumerate(moves):
            dark = ' dark-row' if (line_num % 2 == 0) else ''
            if move_info.space:
                study_lines_status_and_moves += f'''<span> {move_info.space.replace(' ', '&nbsp;')} </span>'''
            if move_info.move_turn():
                study_lines_status_and_moves += f'''<span>{move_info.move_turn()}&nbsp;</span>'''
            study_lines_status_and_moves += self.move_element(move_info, i, 'study')
            if move_info.new_line:
                line_num += 1
                study_lines_status_and_moves += f'''</span><span class="moves-line{dark}">'''
            else:
                study_lines_status_and_moves += f'''<span> &nbsp; </span>'''

        practice_lines_status_and_moves = f'''
                                              <div class="col-6">
                                                  {lines_table}
                                                  {status}
                                                  <div class='row'>
                                                      <div class='col-4'>
                                                          <div class="row move-list-container" style="height:532px;">
                                           '''
        for i in range(1, 301):
                practice_lines_status_and_moves += f'''
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
                                                            style=visibility:"hidden";>
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
                                                            style=visibility:"hidden";>
                                                        </span>
                                                    </div>
                                                </div>
                                            '''
        practice_lines_status_and_moves += '</div></div>'

        keep_playing_button = '''
                                <div class="col-4">
                                    <div class="row empty-row"></div>
                                    <div class="row">
                                        <label id="skill-label">Skill (0-20):
                                            <input type="number" id="skill-input" name="skill" min="0" max="20" value="0">
                                        </label>
                                        <button id="keepPlayingBtn">Continue Playing</button>
                                    </div>
                                </div>
                                <div class="col-4"></div></div></div>
                            '''
        
        if page == 'study':
            practice_buttons = ''
            hidden_practice_moves = ''
            practice_lines_status_and_moves = ''
            keep_playing_button = ''

        if page == 'practice':
            study_lines_status_and_moves = ''

        header_html = f'''
                <div class="container">
                    <div class="row">
                        <div class="col">
                            <h1>{page.capitalize()} the {name}</h1>
                        </div>
                        <div class="col">
                            <h1><a href="/{name}/{other}">{other.capitalize()} the {name}&nbsp;-></a></h1>
                        </div>
                    </div>
                </div>
                        '''
        
        content_html = f'''
                {modal}
                <div hidden id="page" data-page={page}></div>
                    <div class="container">
                        <div class="row">
                            <div class="col">
                                {shared_buttons}
                                {practice_buttons}
                            </div>
                            <div class="col eval-col">
                                {eval_bar}
                            </div>
                            <div class="col-6 board-container">
                                {captured_canvases_and_board}
                                {hidden_practice_moves}
                            </div>
                            {study_lines_status_and_moves}
                            {practice_lines_status_and_moves}
                            {keep_playing_button}
                        </div>
                    </div>
                </div>
            </div>
                        '''
        
        return '''
            {% extends "openings/chess.html" %}

            {% block header %} ''' + header_html + ''' {% endblock %}

            {% block content %} ''' + content_html + ''' {% endblock %}
            '''
    
    def write_html(self, name, page):
        start_position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1'
        moves = self.parsed_dict[name]

        other = 'study' if page == 'practice' else 'practice'
        copy_button = 'PGN' if page == 'practice' else 'FEN'
        status = '''
                    <div class="row board-width">
                        <h2 id="status"></h2>
                    </div>
                '''
        
        hidden_move_class = 'played-selected' if page == 'practice' else 'selected'
        hidden_move = f'''
                        <span hidden id="-1"
                            data-fen={start_position}
                            data-own={start_position}
                            data-parent={start_position}
                            data-child-1={moves[0].fen_dict['own']}
                            data-child-2={moves[0].fen_dict['own']}
                            class="move {hidden_move_class}">
                        </span>
                    '''
        
        shared_buttons = f'''
                            <div class="row empty-row"></div>
                            <div class="row">
                                <button id="copyBtn">Copy {copy_button}</button>
                            </div>
                            <div class="row button-spacer"></div>
                            <div class="row">
                                <button id="swapBtn" class="ignore">Swap</button>
                            </div>
                            <div class="row button-spacer"></div>
                            <div class="row">
                                <button id="restartBtn">Restart</button>
                            </div>
                        '''
        
        practice_buttons = ''' 
                                
                                <div class="row button-spacer"></div>
                                <div class="row">
                                    <button id="difLineBtn">Other Line</button>
                                </div>
                                
                                <div class="row button-spacer"></div>
                                <div class="row">
                                    <button id="hintBtn" class="ignore">Hide Hints</button>
                                </div>
                                <div class="row button-spacer"></div>
                                <div class="row">
                                    <span id="hints" class="text-wrap">No hints currently</span>
                                </div>
                            '''
        
        eval_bar = '''
                    <div class="empty-row"></div>
                    <div id="evalBar">
                        <div class="eval-pop-up"></div>
                        <div class="evalNum evalNumOpp"></div>
                        <div class="blackBar" style="height:50%;"></div>
                        <div class="zero"></div>
                        <div class="evalNum evalNumOwn"></div>
                    </div>
                '''
        
        captured_canvases_and_board = '''
                                <div class="row captured-opp board-width"></div>
                                <div id="board_wrapper" class="row">
                                    <canvas style="pointer-events:none;" id="arrow_canvas" width="700" height="674.17" ></canvas>
                                    <canvas style="pointer-events:none;" id="dot_and_circle_canvas"  width="700" height="674.17" ></canvas>
                                    <div id="myBoard" class="board"></div>
                                </div>
                                <div class="row captured-own board-width"></div>
                            '''
        
        hidden_practice_moves = f'''
                                    <div class="row moves-container-practice">
                                    {hidden_move}
                                '''
        for i, move_info in enumerate(moves):
            hidden_practice_moves += self.move_element(move_info, i, 'practice')
        hidden_practice_moves += '</div>'

        lines_table = '''
                                    <div class="empty-row">
                                        <button id="evalBarBtn" class="ignore">Hide Eval</button>
                                        <button id="lineBtn" class="ignore">Hide Lines</button>
                                    </div>
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
        
        study_lines_status_and_moves = f'''
                                     <div class="col-6">
                                        {lines_table}
                                        {status}
                                        <div class="row moves-container-study">
                                            {hidden_move}
                                            <span class="moves-line">
                                  '''
        line_num = 0
        for i, move_info in enumerate(moves):
            dark = ' dark-row' if (line_num % 2 == 0) else ''
            if move_info.space:
                study_lines_status_and_moves += f'''<span> {move_info.space.replace(' ', '&nbsp;')} </span>'''
            if move_info.move_turn():
                study_lines_status_and_moves += f'''<span>{move_info.move_turn()}&nbsp;</span>'''
            study_lines_status_and_moves += self.move_element(move_info, i, 'study')
            if move_info.new_line:
                line_num += 1
                study_lines_status_and_moves += f'''</span><span class="moves-line{dark}">'''
            else:
                study_lines_status_and_moves += f'''<span> &nbsp; </span>'''

        practice_lines_status_and_moves = f'''
                                              <div class="col-6">
                                                  {lines_table}
                                                  {status}
                                                  <div class='row'>
                                                      <div class='col-4'>
                                                          <div class="row move-list-container" style="height:532px;">
                                           '''
        for i in range(1, 301):
                practice_lines_status_and_moves += f'''
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
                                                            style=visibility:"hidden";>
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
                                                            style=visibility:"hidden";>
                                                        </span>
                                                    </div>
                                                </div>
                                            '''
        practice_lines_status_and_moves += '</div></div>'

        keep_playing_button = '''
                                <div class="col-4">
                                    <div class="row empty-row"></div>
                                    <div class="row">
                                        <label id="skill-label">Skill (0-20):
                                            <input type="number" id="skill-input" name="skill" min="0" max="20" value="0">
                                        </label>
                                        <button id="keepPlayingBtn">Continue Playing</button>
                                    </div>
                                </div>
                                <div class="col-4"></div></div></div>
                            '''
        
        if page == 'study':
            practice_buttons = ''
            hidden_practice_moves = ''
            practice_lines_status_and_moves = ''
            keep_playing_button = ''

        if page == 'practice':
            study_lines_status_and_moves = ''

        header_html = f'''
                <div class="container">
                    <div class="row">
                        <div class="col">
                            <h1>{page.capitalize()} the {name}</h1>
                        </div>
                        <div class="col">
                            <h1><a href="/{name}/{other}">{other.capitalize()} the {name}&nbsp;-></a></h1>
                        </div>
                    </div>
                </div>
                        '''
        
        content_html = f'''
                <div hidden id="page" data-page={page}></div>
                    <div class="container">
                        <div class="row">
                            <div class="col">
                                {shared_buttons}
                                {practice_buttons}
                            </div>
                            <div class="col eval-col">
                                {eval_bar}
                            </div>
                            <div class="col-6 board-container">
                                {captured_canvases_and_board}
                                {hidden_practice_moves}
                            </div>
                            {study_lines_status_and_moves}
                            {practice_lines_status_and_moves}
                            {keep_playing_button}
                        </div>
                    </div>
                </div>
            </div>
                        '''
        
        return '''
            {% extends "openings/chess.html" %}

            {% block header %} ''' + header_html + ''' {% endblock %}

            {% block content %} ''' + content_html + ''' {% endblock %}
            '''
    
    def print_moves(self, name):
        for move_info in self.parsed_dict[name]:
            print(move_info.space, move_info.move_num_san, end='')