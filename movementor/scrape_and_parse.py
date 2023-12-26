from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
import undetected_chromedriver as uc
import time
import io
import chess
import chess.pgn

class MoveInfo():
    def __init__(self, move, color = None, prev_board = None, parent = None, children  = [], end = False, black_variation = False, mainline_split = False):
        self.move = move
        self.color = color
        self.prev_board = prev_board
        self.end = end
        self.black_variation = black_variation
        self.mainline_split = mainline_split
        self.parent= parent
        self.children = children
        self.fen_dict = {
            'own': None,
            'parent': None,
            'child_1': None,
            'child_2': None,
        }
        self.uci_move = self.uci_to_move(False)

    def fix_ambiguous(self, piece):
        sq_set = self.prev_board.pieces(piece.piece_type, piece.color).tolist()
        other = []
        move = self.move.move
        for i, sq in enumerate(sq_set):
            if sq and i != move.from_square:
                other.append(i)
        if other == []:
            return ''
        if chess.Move.from_uci(chess.square_name(other[0]) + chess.square_name(move.to_square)) in self.prev_board.legal_moves:
            for oth in other:
                if chess.square_file(oth) == chess.square_file(move.from_square):
                    return str(chess.square_rank(move.from_square) + 1)
                if chess.square_rank(oth) == chess.square_rank(move.from_square):
                    return chr(chess.square_file(move.from_square) + 97)
            return chr(chess.square_file(move.from_square) + 97)
        return ''

    def move_turn(self, inc_per = False):
        if type(self.move) == str or (self.move.turn() == chess.WHITE and not self.black_variation and not self.mainline_split):
            return ''
        ans = str(int(self.move.ply()/2) + int(self.move.turn() == chess.BLACK))
        if inc_per:
            if self.move.turn() == chess.BLACK:
                    return ans + '. '
            elif self.move.turn() == chess.WHITE and (self.black_variation or self.mainline_split):
                    return ans + '... '
        else:
            return int(ans)

    def uci_to_move(self, turn = True):
        if type(self.move) == str:
            return self.move
        cur_board = self.move.board()
        move = self.move.move
        if turn:
            ans = self.move_turn(True)
        else:
            ans = ''
        if self.prev_board.is_castling(move):
            if self.prev_board.is_kingside_castling(move):
                ans += 'O-O'
            else:
                ans += 'O-O-O'
        else:
            promo = None
            if move.promotion:
                promo = str(move)[4].upper()
            piece = self.prev_board.piece_at(chess.Square(move.from_square))
            if piece.symbol().lower() != 'p':
                ans += piece.symbol().upper() + self.fix_ambiguous(piece)
            if self.prev_board.is_capture(move):
                if piece.symbol().lower() == 'p':
                    ans += str(move)[0]
                ans += 'x'
            ans += chess.square_name(move.to_square)
            if promo:
                ans += '=' + promo
        if cur_board.is_checkmate():
            ans += '#'
        elif cur_board.is_check():
            ans += '+'
        if self.end:
            ans += '\n'
        return ans

    def populate_fen_dict(self):
        if type(self.move) == str:
            return
        self.fen_dict['own'] = self.move.board().fen().replace(' ','_')
        if self.parent:
            self.fen_dict['parent'] = self.parent.board().fen().replace(' ','_')
        if self.children:
            self.fen_dict['child_1'] = self.children[0].board().fen().replace(' ','_')
            if len(self.children) == 2:
                self.fen_dict['child_2'] = self.children[1].board().fen().replace(' ','_')

class PGNParser():
    def __init__(self, pgn, move_list = []):
        self.pgn = pgn
        self.move_list = move_list
        self.parse_pgn()

    def link_parents(self):
        for i, cur_move_info in enumerate(self.move_list[-1:0:-1]):
            if type(cur_move_info.move) != str:
                index = len(self.move_list) - i - 1
                for prev_move_info in self.move_list[index - 1:0:-1]:
                    if type(prev_move_info.move) != str:
                        if cur_move_info.move in prev_move_info.children:
                            cur_move_info.parent = prev_move_info.move
        for move_info in self.move_list:
            move_info.populate_fen_dict()

    def insert_bars(self):
        for i, cur_move_info in enumerate(self.move_list[::-1]):
            index = len(self.move_list) - i - 1
            if type(self.move_list[index - 1].move) == str:
                cur_spaces = index - 1
                cur_spaces_length = len(self.move_list[index - 1].move)
                for j, prev_move in enumerate([move_info.move for move_info in self.move_list[cur_spaces - 1:0:-1]]):
                    if cur_move_info.parent == prev_move:
                        break
                    if type(prev_move) == str:
                        prev_spaces = cur_spaces - j - 1
                        if cur_spaces_length < len(prev_move):
                            self.move_list[prev_spaces].move = prev_move[0:len(self.move_list[cur_spaces].move)] + '|' +\
                                                                        prev_move[len(self.move_list[cur_spaces].move) + 1:]
                        else:
                            break

    def parse_variations(self, variations, start_board, parent_line):
        for i, cur_move in enumerate(variations):
            color = 'black' if cur_move.turn() == chess.WHITE else 'white'
            first = cur_move
            variation_stack = []
            prev_boards = []
            wait = False
            prev_board = start_board
            turn = int(cur_move.ply()/2) + int(cur_move.turn() == chess.BLACK)
            spaces = parent_line.find(str(turn) + '.')
            cur_line = ' ' * (spaces + 2 + len(str(turn)))
            self.move_list.append(MoveInfo(cur_line))
            while not cur_move.is_end():
                b_v = cur_move.turn() == chess.WHITE and cur_move == first
                if len(cur_move.variations) > 1:
                    variation_stack.append(cur_move.variations[1:])
                    for j in range(len(cur_move.variations[1:])):
                        prev_boards.append(cur_move.board())
                cur_line += MoveInfo(cur_move, color, prev_board, black_variation=b_v).uci_to_move() + ' '
                if i != len(variations) - 1 and not wait and cur_move == first:
                    wait = True
                    c = [cur_move.variations[0], variations[i + 1]]
                else:
                    c = [move for k, move in enumerate(cur_move.variations) if k < 2]
                self.move_list.append(MoveInfo(cur_move, color, prev_board, children=c, black_variation=b_v))
                prev_board = cur_move.board()
                cur_move = cur_move.next()
                color = 'black' if cur_move.turn() == chess.WHITE else 'white'
            b_v = cur_move.turn() == chess.WHITE and cur_move == first
            cur_line += MoveInfo(cur_move, color, prev_board, end=True, black_variation=b_v).uci_to_move()
            c = [move for k, move in enumerate(cur_move.variations) if k < 2]
            self.move_list.append(MoveInfo(cur_move, color, prev_board, children=c, end=True, black_variation=b_v))
            for i, variation in enumerate(variation_stack[::-1]):
                self.parse_variations(variation, prev_boards[len(variation_stack) - 1 - i], cur_line)

    def parse_pgn(self):
        cur_move = self.pgn.variations[0]
        prev_board = chess.Board()
        prev_parent_board = chess.Board()
        parent = cur_move
        prev_parent = cur_move
        variations_w = []
        variations_b = []
        wait = 0
        while True:
            if variations_w:
                wait += 1
                if wait == 1:
                    variation_prev_w_board = prev_board
            if cur_move.is_end():
                if cur_move.turn() == chess.WHITE:
                    self.move_list.append(MoveInfo(parent, 'white', prev_parent.board(), prev_parent,
                                                   [move for i, move in enumerate(parent.variations) if i < 2]))
                    self.move_list.append(MoveInfo(cur_move, 'black', prev_board, parent))
                break
            if len(cur_move.variations) > 1:
                if cur_move.turn() == chess.WHITE:
                    variations_w = cur_move.variations[1:]
                else:
                    variations_b = cur_move.variations[1:]
            if cur_move.turn() == chess.WHITE:
                self.move_list.append(MoveInfo(parent, 'white', prev_parent_board, prev_parent,
                                               [move for i, move in enumerate(parent.variations) if i < 2]))
                cur_line = self.move_list[-1].uci_to_move()
                both = False
                if ((variations_w and wait == 2) or variations_b):
                    if variations_w and wait == 2:
                        if not variations_b:
                            self.move_list.append(MoveInfo(cur_move, 'black', prev_board, parent,
                                                           [move for i, move in enumerate(cur_move.variations) if i < 2],
                                                           end=True))
                            cur_line +=  ' ' + self.move_list[-1].uci_to_move()
                        else:
                            self.move_list[-1].end = True
                            cur_line = self.move_list[-1].uci_to_move()
                            both = True
                        self.parse_variations(variations_w, variation_prev_w_board, cur_line)
                        variations_w = []
                        wait = 0
                    if variations_b:
                        self.move_list.append(MoveInfo(cur_move, 'black', prev_board, parent,
                                                       [move for i, move in enumerate(cur_move.variations) if i < 2],
                                                       end=True, mainline_split=both))
                        if not both:
                            cur_line +=  ' ' + self.move_list[-1].uci_to_move()
                        else:
                            cur_line = self.move_list[-1].uci_to_move()
                        self.parse_variations(variations_b, prev_board, cur_line)
                        variations_b = []
                else:
                    self.move_list.append(MoveInfo(cur_move, 'black', prev_board, parent,
                                                   [move for i, move in enumerate(cur_move.variations) if i < 2],
                                                   end=True))
                    cur_line +=  ' ' + self.move_list[-1].uci_to_move()
            prev_board = cur_move.board()
            if cur_move != self.pgn.variations[0]:
                prev_parent = parent
                prev_parent_board = prev_parent.board()
            parent = cur_move
            cur_move = cur_move.next()
        self.link_parents()
        self.insert_bars()

class PGNScraper():
    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.chromeOptions = uc.ChromeOptions()
        self.chromeOptions.add_argument('--headless=new')
        self.chromeOptions.add_experimental_option('excludeSwitches', ['enable-logging'])
        self.driver = webdriver.Chrome(options=self.chromeOptions)
        self.driver.get('https://www.chess.com/login_and_go?returnUrl=https://www.chess.com/')
        self.pgn_dict = {}
        self.parsed_dict = {}
        self.populate_dicts()
        
    def login_and_retrieve_analyses(self):
            uname = self.driver.find_element(By.ID, "username")
            uname.send_keys(self.username)
            password = self.driver.find_element(By.ID, "password")
            password.send_keys(self.password)
            self.driver.find_element(By.NAME, "login").click()
            time.sleep(2)
            self.driver.get('https://www.chess.com/analysis/saved')
            time.sleep(2)

    def scrape_analyses(self):
        content = self.driver.page_source
        soup = BeautifulSoup(content, features='lxml')
        for analysis in soup.findAll(attrs={'class': 'saved-analysis-item-component'}):
            name = analysis.find('a')
            pgn = analysis.find('p')
            self.pgn_dict[name.text] = chess.pgn.read_game(io.StringIO(pgn.text))
        self.driver.close()

    def populate_dicts(self):
        self.login_and_retrieve_analyses()
        self.scrape_analyses()
        for k, v in self.pgn_dict.items():
            p = PGNParser(v, [])
            self.parsed_dict[k] = p.move_list

    def write_view_html(self, name):
        moves = self.parsed_dict[name]
        html = '''
            {% extends 'openings/view.html' %}

            {% block header %}
                <h1>Study the ''' + name + ''' Opening</h1>
            {% endblock %}

            {% block content %}
                <div class='container'>
                    <div class='row'>
                        <div class='col'>
                            <div class='row'>
                                <div id="myBoard" class='board'></div>
                            </div>
                            <div class='row'>
                                <button id="switchBtn">Switch Colors</button>
                            </div>
                        </div>
                        <div class='col moves-container-view'>
                            <div class='row'>
                                <h2 id='status'></h2>
                            </div>
                            <div class='row'>'''
        pos = 0
        while pos < len(moves):
            html += '''<span class = 'moves-line'>'''
            for move_info in moves[pos:]:
                move_str = move_info.uci_to_move()
                if move_str[0] == ' ':
                    text = ''
                    for ch in move_info.move:
                        if ch == ' ':
                            text += '&nbsp;'
                        elif ch == '|':
                            text += '|'
                    html += '''<span> ''' + text + ''' </span>'''
                else:
                    turn = move_info.move_turn(True)
                    if turn:
                        html += '''<span>''' + turn[0:len(turn) - 1] + '''&nbsp;</span>'''
                    html += '''<span id = ''' + str(pos) + ''' data-own = ''' + move_info.fen_dict['own']
                    if move_info.fen_dict['parent']:
                        html += ''' data-parent = ''' + move_info.fen_dict['parent']
                    if move_info.fen_dict['child_1']: 
                        html += ''' data-child-1 = ''' + move_info.fen_dict['child_1']
                    if move_info.fen_dict['child_2']:
                        html += ''' data-child-2 = ''' + move_info.fen_dict['child_2']
                    if move_info.move.is_mainline():
                        html += ''' data-mainline = True'''
                    html += ''' data-uci-move = ''' + move_info.uci_move + ''' data-color = ''' + move_info.color + '''
                                data-turn = ''' + str(int(move_info.move.ply()/2) + int(move_info.move.turn() == chess.BLACK)) + '''
                                class = 'move'> '''
                    if turn:
                        html += move_str[len(str(turn)):] + ''' </span>'''
                    else:
                        html += move_str + ''' </span>'''
                    if move_str[len(move_str) - 1::] == '\n':
                        pos += 1
                        break
                    else:
                        html += '''<span> &nbsp; </span>'''
                pos += 1
            html += '''</span>'''

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
                <h1>Practice the ''' + name + ''' Opening</h1>
            {% endblock %}

            {% block content %}
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
        pos = 0
        while pos < len(moves):
            for move_info in moves[pos:]:
                move_str = move_info.uci_to_move()
                if move_str[0] != ' ':
                    html += '''<span id = ''' + str(pos) + ''' data-own = ''' + move_info.fen_dict['own']
                    if move_info.fen_dict['parent']:
                        html += ''' data-parent = ''' + move_info.fen_dict['parent']
                    if move_info.fen_dict['child_1']: 
                        html += ''' data-child-1 = ''' + move_info.fen_dict['child_1']
                    if move_info.fen_dict['child_2']:
                        html += ''' data-child-2 = ''' + move_info.fen_dict['child_2']
                    html += ''' data-uci-move = ''' + move_info.uci_move + ''' data-color = ''' + move_info.color + '''
                                 data-turn = ''' + str(int(move_info.move.ply()/2) + int(move_info.move.turn() == chess.BLACK)) + '''></span>'''
                    if move_str[len(move_str) - 1::] == '\n':
                        pos += 1
                pos += 1
            html += '''     </div>
                        </div>
                        <div class='col-2 justify-content-center'>'''
            html += ''' <div class='row'>
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
        for move in [move_info.uci_to_move() for move_info in self.parsed_dict[name][0:-1]]:
            if move[len(move) - 1::] != '\n' and move[0] != ' ':
                print(move, end = ' ')
            else:
                print(move, end = '')
        print(self.parsed_dict[name][-1].uci_to_move())

p = PGNScraper('NZemlin', 'R44NtztVqYrqSte!')