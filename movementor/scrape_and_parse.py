from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
import undetected_chromedriver as uc
import time
import io
import chess
import chess.pgn

def get_pgns():
    chromeOptions = uc.ChromeOptions()
    chromeOptions.add_argument('--headless=new')
    chromeOptions.add_experimental_option('excludeSwitches', ['enable-logging'])
    driver = webdriver.Chrome(options=chromeOptions)
    driver.get('https://www.chess.com/login_check')

    uname = driver.find_element(By.ID, "username")
    uname.send_keys("NZemlin")
    passwordF = driver.find_element(By.ID, "password")
    passwordF.send_keys("R44NtztVqYrqSte!")
    driver.find_element(By.NAME, "login").click()
    time.sleep(2)
    driver.get('https://www.chess.com/analysis/saved')
    time.sleep(2)

    analyses = []
    content = driver.page_source
    soup = BeautifulSoup(content, features='lxml')
    for analysis in soup.findAll(attrs={'class': 'saved-analysis-item-component'}):
        name = analysis.find('a')
        pgn = analysis.find('p')
        analyses.append([name.text, pgn.text])
    driver.close()
    return analyses

def fix_ambiguous(board, move, piece):
    sq_set = board.pieces(piece.piece_type, piece.color).tolist()
    other = []
    for i, sq in enumerate(sq_set):
        if sq and i != move.from_square:
            other.append(i)
    if other == []:
        return ''
    if chess.Move.from_uci(chess.square_name(other[0]) + chess.square_name(move.to_square)) in board.legal_moves:
        for oth in other:
            if chess.square_file(oth) == chess.square_file(move.from_square):
                return str(chess.square_rank(move.from_square) + 1)
            if chess.square_rank(oth) == chess.square_rank(move.from_square):
                return chr(chess.square_file(move.from_square) + 97)
        return chr(chess.square_file(move.from_square) + 97)
    return ''

def move_turn(move, black_variation, inc_per = False):
    if move.turn() == chess.WHITE and not black_variation:
        return None
    ans = ''
    if move.turn() == chess.BLACK:
        ans += str(int(move.ply()/2) + 1)
        if inc_per:
            ans  += '. '
    elif move.turn() == chess.WHITE and black_variation:
        ans += str(int(move.ply()/2))
        if inc_per:
            ans  += '... '
    if inc_per:
        return ans
    else:
        return int(ans)

def uci_to_move(data):
    move, prev_board, end, black_variation = data
    if type(move) == str:
        return move
    cur_board = move.board()
    ans = move_turn(move, black_variation, True)
    if not ans:
        ans = ''
    if prev_board.is_castling(move.move):
        if prev_board.is_kingside_castling(move.move):
            ans += 'O-O'
        else:
            ans += 'O-O-O'
    else:
        promo = None
        if move.move.promotion:
            promo = str(move.move)[4].upper()
        piece = prev_board.piece_at(chess.Square(move.move.from_square))
        if piece.symbol().lower() != 'p':
            ans += piece.symbol().upper() + fix_ambiguous(prev_board, move.move, piece)
        if prev_board.is_capture(move.move):
            if piece.symbol().lower() == 'p':
                ans += str(move.move)[0]
            ans += 'x'
        ans += chess.square_name(move.move.to_square)
        if promo:
            ans += '=' + promo
    if cur_board.is_checkmate():
        ans += '#'
    elif cur_board.is_check():
        ans += '+'
    if end:
        ans += '\n'
    return ans

def insert_bars(move_list):
    for i, cur_move in enumerate([move[0] for move in move_list[::-1]]):
        if type(cur_move[0]) == str:
            latest_spaces = len(move_list) - i - 1
            newline_count = 0
            for j, m in enumerate([move[0] for move in move_list[len(move_list) - 2 - i:0:-1]]):
                prev_move = m[0]
                if m[2] == '\n':
                    newline_count += 1
                    if newline_count == 2:
                        break
                if type(prev_move) == str:
                    if prev_move == '   ':
                        break
                    newline_count = 0
                    cur_spaces = latest_spaces - j - 1
                    if move_turn(move_list[latest_spaces + 1][0][0], move_list[latest_spaces + 1][0][3]) < move_turn(move_list[cur_spaces + 1][0][0], move_list[cur_spaces + 1][0][3]):
                        move_list[cur_spaces][0][0] = prev_move[0:len(move_list[latest_spaces][0][0])] + '|' + prev_move[len(move_list[latest_spaces][0][0]) + 1:]
                    else:
                        break
    return move_list

def link_parents(move_list):
    for i, cur_move in enumerate([move[0][0] for move in move_list[-1:0:-1]]):
        if type(cur_move) != str:
            index = len(move_list) - i - 1
            cur_variation = move_list[index][0]
            cur_move_turn = move_turn(cur_variation[0], cur_variation[3], True)
            cur_move_turn_num = move_turn(cur_variation[0], cur_variation[3])
            if type(move_list[index - 1][0][0]) != str:
                if cur_move.is_mainline() and cur_move_turn:
                    continue
                move_list[index][1] = move_list[index - 1][0][0]
                continue
            cur_double = int(cur_move_turn[1].isnumeric())
            for j, prev_move in enumerate([move[0] for move in move_list[index - 2:0:-1]]):
                prev_index = index - j - 2
                if type(prev_move[0]) != str:
                    prev_move_turn = move_turn(prev_move[0], prev_move[3], True)
                    prev_move_turn_num = move_turn(prev_move[0], prev_move[3])
                    if not prev_move_turn:
                        continue
                    if len(cur_move_turn) == 5 + cur_double and cur_move_turn_num == prev_move_turn_num:
                        move_list[index][1] = prev_move[0]
                        break
                    if len(cur_move_turn) == 3 and cur_move_turn[0] == prev_move_turn[0]:
                        if type(move_list[prev_index - 1][0][0]) == str:
                            move_list[index][1] = prev_move[0]
                            break
                        else:
                            move_list[index][1] = move_list[prev_index - 1][0][0]
                            break
                
    return move_list

def parse_game(game):
    cur_move = game.variations[0]
    prev_board = chess.Board()
    prev_parent_board = chess.Board()
    parent = cur_move
    prev_parent = cur_move
    variations_w = []
    variations_b = []
    move_list = []
    wait = 0
    while True:
        if variations_w:
            wait += 1
            if wait == 1:
                variation_prev_w_board = prev_board
        if cur_move.is_end():
            if cur_move.turn() == chess.WHITE:
                move_list.extend([[[parent, prev_parent.board(), False, False], prev_parent, [move for i, move in enumerate(parent.variations) if i < 2]],
                                  [[cur_move, prev_board, False, False], parent, []]])
            else:
                move_list.append([[cur_move, prev_board, False, False], parent, []])
            break
        if len(cur_move.variations) > 1:
            if cur_move.turn() == chess.WHITE:
                variations_w = cur_move.variations[1:]
            else:
                variations_b = cur_move.variations[1:]
        if cur_move.turn() == chess.WHITE:
            move_list.extend([[[parent, prev_parent_board, False, False], prev_parent, [move for i, move in enumerate(parent.variations) if i < 2]],
                              [[cur_move, prev_board, True, False], parent, [move for i, move in enumerate(cur_move.variations) if i < 2]]])
            cur_line = ' '.join([uci_to_move(move[0]) for move in move_list[len(move_list) - 2:]])
            if ((variations_w and wait == 2) or variations_b):
                if variations_w and wait == 2:
                    move_list = parse_variations(variations_w, variation_prev_w_board, move_list, cur_line)
                    variations_w = []
                    wait = 0
                if variations_b:
                    move_list = parse_variations(variations_b, prev_board, move_list, cur_line)
                    variations_b = []
        prev_board = cur_move.board()
        if cur_move != game.variations[0]:
            prev_parent = parent
            prev_parent_board = prev_parent.board()
        parent = cur_move
        cur_move = cur_move.next()
    move_list = insert_bars(move_list)
    move_list = link_parents(move_list)
    return move_list

def parse_variations(variations, start_board, move_list, parent_line):
    for i, cur_move in enumerate(variations):
        first = cur_move
        variation_stack = []
        prev_boards = []
        wait = False
        prev_board = start_board
        turn = int(cur_move.ply()/2) + int(cur_move.turn() == chess.BLACK)
        spaces = parent_line.find(str(turn) + '.')
        cur_line = ' ' * (spaces + 2 + len(str(turn)))
        move_list.append([[cur_line, None, False, False], None, []])
        while not cur_move.is_end():
            black_variation = cur_move.turn() == chess.WHITE and cur_move == first
            if len(cur_move.variations) > 1:
                variation_stack.append(cur_move.variations[1:])
                for j in range(len(cur_move.variations[1:])):
                    prev_boards.append(cur_move.board())
            cur_line += uci_to_move([cur_move, prev_board, False, black_variation]) + ' '
            if i != len(variations) - 1 and not wait and cur_move == first:
                wait = True
                children = [cur_move.variations[0], variations[i + 1]]
            else:
                children = [move for k, move in enumerate(cur_move.variations) if k < 2]
            move_list.append([[cur_move, prev_board, False, black_variation], None, children])
            prev_board = cur_move.board()
            cur_move = cur_move.next()
        black_variation = cur_move.turn() == chess.WHITE and cur_move == first
        cur_line += uci_to_move([cur_move, prev_board, True, black_variation])
        move_list.append([[cur_move, prev_board, True, black_variation], None, [move for k, move in enumerate(cur_move.variations) if k < 2]])
        for i, variation in enumerate(variation_stack[::-1]):
            move_list = parse_variations(variation, prev_boards[len(variation_stack) - 1 - i], move_list, cur_line)
    return move_list

def create_fen_dict(move):
    d = {}
    d['own'] = move[0][0].board().fen().replace(' ','_')
    if move[1]:
        d['parent'] = move[1].board().fen().replace(' ','_')
    else:
        d['parent'] = None
    if move[2]:
        d['child_1'] = move[2][0].board().fen().replace(' ','_')
        if len(move[2]) == 2:
            d['child_2'] = move[2][1].board().fen().replace(' ','_')
        else:
            d['child_2'] = None
    else:
        d['child_1'] = None
        d['child_2'] = None
    return d

def print_moves(moves):
    for move in [uci_to_move(move[0]) for move in moves[0:-1]]:
        if move[len(move) - 1::] != '\n' and move[0] != ' ':
            print(move, end = ' ')
        else:
            print(move, end = '')
    print(uci_to_move(moves[-1][0]))

def print_parsed_games(parsed_games):
    for k,v in parsed_games.items():
        counter = 0
        if counter == 1:
            break
        print(k)
        for move in v['moves']:
            cur_line = str(move[0])
            if move[0][len(move[0]) - 1::] == '\n':
                cur_line = str(move[0][0:len(move[0]) - 1])
            elif move[0][0] == ' ':
                cur_line = 'spaces'
            if move[1]:
                cur_line += '; parent: ' + str(move[1].move)
            else:
                cur_line += '; parent: none'
            if move[2]:
                cur_line += '; children: '
                for m in move[2]:
                    cur_line += str(m.move) + ', '
            else:
                cur_line += '; children: none'
            print(cur_line)
        print('\n\n\n\n\n')
        counter += 1

pgns = get_pgns()

games = []
for pgn in pgns:
    games.append([pgn[0], chess.pgn.read_game(io.StringIO(pgn[1]))])

parsed_games = {}
for game in games:
    moves = parse_game(game[1])
    parsed_games[game[0]] = moves