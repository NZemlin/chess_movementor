class PGNWriter():
    def __init__(self, parsed_dict):
        self.parsed_dict = parsed_dict
        
    def move_element(self, move, i, page):
        return '''<span ''' + ('hidden' if page == 'practice' else '') + '''
                   id = ''' + str(i) + '''
                   data-own = ''' + move.fen_dict['own'] + '''
                   data-parent = ''' + move.fen_dict['parent'] + '''
                   data-child-1 = ''' + move.fen_dict['child_1'] + '''
                   data-child-2 = ''' + move.fen_dict['child_2'] + '''
                   data-mainline = ''' + str(move.move.is_mainline()).lower() + '''
                   data-variation-start = ''' + str(move.move.starts_variation()).lower() + '''
                   data-san = ''' + move.move.san() + '''
                   data-uci = ''' + move.move.uci() + '''
                   data-color = ''' + ('white' if not move.move.turn() else 'black') + '''
                   data-turn = ''' + move.turn_number() + '''
                   data-eval = ''' + str(move.eval) + '''
                   class='move ignore'>''' + move.move.san() + '''</span>'''

    def write_view_html(self, name):
        start_position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1'
        moves = self.parsed_dict[name]
        html = '''
            {% extends 'openings/view.html' %}

            {% block header %}
                <div class='container'>
                    <div class='row'>
                        <div class='col'>
                            <h1>Study the ''' + name + '''</h1>
                        </div>
                        <div class='col'>
                            <a href="/''' + name + '''/practice"><h1>Practice the ''' + name + '''</h1></a>
                        </div>
                    </div>
                </div>
            {% endblock %}

            {% block content %}
                <div hidden id='page' data-page='view'></div>
                <div class='container'>
                    <div class='row'>
                        <div class='col'>
                            <div class='empty-row'></div>
                            <div class='row'>
                                <button id="switchBtn" class='ignore'>Switch Colors</button>
                            </div>
                        </div>
                        <div class='col eval-col'>
                            <div class='empty-row'></div>
                            <div id='evalBar'>
                                <div class='eval-pop-up'>0.22</div>
                                <div class='evalNum evalNumOpp'>0.22</div>
                                <div class='blackBar' style='height:50%;'></div>
                                <div class='zero'></div>
                                <div class='evalNum evalNumOwn'>0.22</div>
                            </div>
                        </div>
                        <div class='col-6 board-container'>
                            <div class='row captured-opp board-width'></div>
                            <div id='board_wrapper' class='row'>
                                <canvas style="pointer-events:none;" id="primary_canvas" width="700" height="674.17" ></canvas>
                                <canvas style="pointer-events:none;" id="drawing_canvas"  width="700" height="674.17" ></canvas>
                                <div id="myBoard" class='board'></div>
                            </div>
                            <div class='row captured-own board-width'></div>
                        </div>
                        <div class='col-6'>
                            <div class='empty-row'></div>
                            <div class='row board-width'>
                                <h2 id='status'></h2>
                            </div>
                            <div class='row moves-container-view'>
                                <span hidden id = "-1"
                                    data-own = ''' + start_position + '''
                                    data-parent = ''' + start_position + '''
                                    data-child-1 = ''' + moves[0].fen_dict['own'] + '''
                                    data-child-2 = ''' + moves[0].fen_dict['own'] + '''
                                    data-eval = 0.22 class='move selected'></span>
                                <span class = 'moves-line'>'''
        for i, move_info in enumerate(moves):
            if move_info.space:
                html += '''<span> ''' + move_info.space.replace(' ', '&nbsp;') + ''' </span>'''
            if move_info.move_turn():
                html += '''<span>''' + move_info.move_turn() + '''&nbsp;</span>'''
            html += self.move_element(move_info, i, 'view')
            if move_info.new_line:
                html += '''</span><span class = 'moves-line'>'''
            else:
                html += '''<span> &nbsp; </span>'''

        html += '''         </div>
                        </div>
                    </div>
                </div>
            {% endblock %}
            '''
        return html

    def write_practice_html(self, name):
        start_position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1'
        moves = self.parsed_dict[name]
        html = '''
            {% extends 'openings/practice.html' %}

            {% block header %}
                <div class='container'>
                    <div class='row'>
                        <div class='col'>
                            <h1>Practice the ''' + name + '''</h1>
                        </div>
                        <div class='col'>
                            <a href="/''' + name + '''/view"><h1>Study the ''' + name + '''</h1></a>
                        </div>
                    </div>
                </div>
            {% endblock %}

            {% block content %}
                <div hidden id='page' data-page='practice'></div>
                <div class='container'>
                    <div class='row'>
                        <div class='col'>
                            <div class='row empty-row'></div>
                            <div class='row'>
                                <button id="restartBtn">Restart</button>
                            </div>
                            <div class='row button-spacer'></div>
                            <div class='row'>
                                <button id="difLineBtn">Different Line</button>
                            </div>
                            <div class='row button-spacer'></div>
                            <div class='row'>
                                <button id="switchBtn" class='ignore'>Switch Colors</button>
                            </div>
                            <div class='row button-spacer'></div>
                            <div class='row'>
                                <button id="evalBarBtn" class='ignore'>Hide Eval</button>
                            </div>
                            <div class='row button-spacer'></div>
                            <div class='row'>
                                <button id="hintBtn" class='ignore'>Hide Hints</button>
                            </div>
                            <div class='row button-spacer'></div>
                            <div class='row'>
                                <span id="hints" class='text-wrap'>No hints currently</span>
                            </div>
                        </div>
                        <div class='col eval-col'>
                            <div class='empty-row'></div>
                            <div id='evalBar'>
                                <div class='eval-pop-up'>0.22</div>
                                <div class='evalNum evalNumOpp'>0.22</div>
                                <div class='blackBar' style='height:50%;'></div>
                                <div class='zero'></div>
                                <div class='evalNum evalNumOwn'>0.22</div>
                            </div>
                        </div>
                        <div class='col-6 board-container'>
                            <div class='row captured-opp board-width'></div>
                            <div id='board_wrapper' class='row'>
                                <canvas style="pointer-events:none;" id="primary_canvas" width="700" height="674.17" ></canvas>
                                <canvas style="pointer-events:none;" id="drawing_canvas"  width="700" height="674.17" ></canvas>
                                <div id="myBoard" class='board'></div>
                            </div>
                            <div class='row captured-own board-width'></div>
                            <div class='row moves-container-practice'>
                                <span hidden id = "-1"
                                    data-fen = ''' + start_position + '''
                                    data-own = ''' + start_position + '''
                                    data-parent = ''' + start_position + '''
                                    data-child-1 = ''' + moves[0].fen_dict['own'] + '''
                                    data-child-2 = ''' + moves[0].fen_dict['own'] + '''
                                    data-eval = 0.22 class='move played-selected'></span>'''
        for i, move_info in enumerate(moves):
            html += self.move_element(move_info, i, 'practice')
        html += '''         </div>
                        </div>
                        <div class='col-3'>
                            <div class='empty-row'></div>
                            <div class='row'>
                                <h2 id='status'></h2>
                            </div>
                            <div class='move-list-container'>
                        '''
        for i in range(1, 101):
            html += '''
                            <div class='row'>
                                <div hidden id='n''' + str(i) + '''' class='col-2 move-list-num'>''' + str(i) + '''.</div>
                                <div class='col-4'><span id='w''' + str(i) + '''' class='move-list played-move ignore'
                                    data-fen = '' data-source = '' data-target= '' data-prev-move=b''' + str(i-1) + '''
                                    data-next-move=b''' + str(i) + ''' data-eval = '' style=visibility:'hidden';></span></div>
                                <div class='col-4'><span id='b''' + str(i) + '''' class='move-list played-move ignore'
                                    data-fen = '' data-source = '' data-target= '' data-prev-move=w''' + str(i) + '''
                                    data-next-move=w''' + str(i+1) + ''' data-eval = '' style=visibility:'hidden';></span></div>
                            </div>
                            '''
        html += '''         </div>
                        </div>
                        <div class='col-1'>
                            <div class='row empty-row'></div>
                            <div class='row'>
                                <button id='keepPlayingBtn'>Continue Playing</button>
                            </div>
                        </div>
                        <div class='col-2'></div>
                    </div>
                </div>
            {% endblock %}
            '''
        return html

    def print_moves(self, name):
        for move_info in self.parsed_dict[name]:
            print(move_info.space, move_info.move_num_san, end='')