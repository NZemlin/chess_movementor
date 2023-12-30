class PGNWriter():
    def __init__(self, parsed_dict):
        self.parsed_dict = parsed_dict
        
    def move_element(self, move, i, page):
        return '''<span ''' + ('hidden' if page == 'practice' else '') +  ''' id = ''' + str(i) + ''' data-own = ''' + move.fen_dict['own'] + '''
                   data-parent = ''' + move.fen_dict['parent'] + ''' data-child-1 = ''' + move.fen_dict['child_1'] + '''
                   data-child-2 = ''' + move.fen_dict['child_2'] + ''' data-mainline = ''' + str(move.move.is_mainline()) + '''
                   data-uci-move = ''' + move.move.san() + ''' data-color = ''' + ('white' if not move.move.turn() else 'black') + '''
                   data-turn = ''' + move.turn_number() + ''' class = 'move'>''' + move.move.san() + ''' </span>'''

    def write_view_html(self, name):
        moves = self.parsed_dict[name]
        html = '''
            {% extends 'openings/view.html' %}

            {% block header %}
                <h1>Study the ''' + name + '''</h1>
            {% endblock %}

            {% block content %}
                <div hidden id='page' data-page='view'></div>
                <div class='container'>
                    <div class='row'>
                        <div class='col'>
                            <div class='row'>
                                <div id="myBoard" class='board'></div>
                            </div>
                            <div class='row'>
                                <button id="switchBtn">Switch Colors</button>
                            </div>
                            <div class='row'>
                                <h2 id='status'></h2>
                            </div>
                        </div>
                        <div class='col moves-container-view'>
                            <div class='row'>
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
        moves = self.parsed_dict[name]
        html = '''
            {% extends 'openings/practice.html' %}

            {% block header %}
                <h1>Practice the ''' + name + '''</h1>
            {% endblock %}

            {% block content %}
                <div hidden id='page' data-page='practice'></div>
                <div class='container'>
                    <div class='row'>
                        <div class='col-1 justify-content-center'>
                            <div class='row'>
                                <button id="restartBtn">Restart</button>
                            </div>
                            <div class='row'>
                                <button id="difLineBtn">Different Line</button>
                            </div>
                            <div class='row'>
                                <button id="switchBtn">Switch Colors</button>
                            </div>
                            <div class='row'>
                                <button id="hintBtn">Hide Hints</button>
                            </div>
                            <div class='row'>
                                <span id="hints">No hints currently</span>
                            </div>
                        </div>
                        <div class='col'>
                            <div class='row justify-content-center'>
                                <div id="myBoard" class='board'></div>
                            </div>
                            <div class='row moves-container-practice'>'''
        for i, move_info in enumerate(moves):
            html += self.move_element(move_info, i, 'practice')
        html += '''     </div>
                    </div>
                    <div class='col-2 justify-content-center'>
                    <div class='row'>
                        <h2 id='status'></h2>
                    </div>
                    '''
        for i in range(1, 31):
            html += '''
                        <div class='row'>
                            <div hidden id='n''' + str(i) + '''' class='col-2 move-list-num'>''' + str(i) + '''.</div>
                            <div id='w''' + str(i) + '''' class='col move-list'></div>
                            <div id='b''' + str(i) + '''' class='col move-list'></div>
                        </div>
                        '''
        html += '''     </div>
                    </div>
                </div>
            {% endblock %}
            '''
        return html

    def print_moves(self, name):
        for move_info in self.parsed_dict[name]:
            print(move_info.space, move_info.move_num_san, end='')