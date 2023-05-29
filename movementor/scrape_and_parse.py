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

def uci_to_move(cur_board, prev_board, move):
    if prev_board.is_castling(move):
        if prev_board.is_kingside_castling(move):
            return 'O-O'
        else:
            return 'O-O-O'
    ans = ''
    promo = None
    if move.promotion:
        promo = str(move)[4].upper()
    piece = prev_board.piece_at(chess.Square(move.from_square))
    if piece.symbol().lower() != 'p':
        ans += piece.symbol().upper() + fix_ambiguous(prev_board, move, piece)
    if prev_board.is_capture(move):
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
    return ans

def move_turn(line):
    for i, ch in enumerate(line):
        if ch == '.':
            return int(line[0:i])

def insert_bars(move_list):
    for i, cur_move in enumerate(move_list[::-1]):
        if cur_move[0] == ' ':
            latest_spaces = len(move_list) - i - 1
            newline_count = 0
            for j, prev_move in enumerate(move_list[len(move_list) - 2 - i:0:-1]):
                if prev_move == '   ':
                    break
                if prev_move[len(prev_move) - 1::] == '\n':
                    newline_count += 1
                    if newline_count == 2:
                        break
                if prev_move[0] == ' ':
                    newline_count = 0
                    cur_spaces = latest_spaces - j - 1
                    if move_turn(move_list[latest_spaces + 1]) < move_turn(move_list[cur_spaces + 1]):
                        move_list[cur_spaces] = prev_move[0:len(move_list[latest_spaces])] + '|' + prev_move[len(move_list[latest_spaces]) + 1:]
                    else:
                        break
    return move_list

def parse_game(game):
    cur_move = game.variations[0]
    prev_board = chess.Board()
    variations_w = []
    variations_b = []
    move_list = []
    fen_list = []
    white_move = ''
    wait = 0
    while True:
        if cur_move.turn() == chess.BLACK:
            white_move = uci_to_move(cur_move.board(),prev_board, cur_move.move)
        if variations_w:
            wait += 1
            if wait == 1:
                variation_prev_w_board = prev_board
        if cur_move.is_end():
            if cur_move.turn() == chess.WHITE:
                move_list.extend([str(int(cur_move.ply()/2)) + '. ' + white_move, uci_to_move(cur_move.board(), prev_board, cur_move.move)])
                fen_list.extend([prev_board.fen(), cur_move.board().fen()])
            else:
                move_list.append(str(int(cur_move.ply()/2) + 1) + '. ' + white_move)
                fen_list.append(cur_move.board().fen())
            break
        if len(cur_move.variations) > 1:
            if cur_move.turn() == chess.WHITE:
                variations_w = cur_move.variations[1:]
            else:
                variations_b = cur_move.variations[1:]
        if cur_move.turn() == chess.WHITE:
            move_list.extend([str(int(cur_move.ply()/2)) + '. ' + white_move, uci_to_move(cur_move.board(), prev_board, cur_move.move) + '\n'])
            cur_line = ' '.join(move_list[len(move_list) - 2:])
            fen_list.extend([prev_board.fen(), cur_move.board().fen()])
            if ((variations_w and wait == 2) or variations_b):
                if variations_w and wait == 2:
                    move_list, fen_list = parse_variations(variations_w, variation_prev_w_board, move_list, fen_list, cur_line)
                    variations_w = []
                    wait = 0
                if variations_b:
                    move_list, fen_list = parse_variations(variations_b, prev_board, move_list, fen_list, cur_line)
                    variations_b = []
        prev_board = cur_move.board()
        cur_move = cur_move.next()
    move_list = insert_bars(move_list)
    return move_list, fen_list

def parse_variations(variations, start_board, move_list, fen_list, parent):
    for cur_move in variations:
        variation_stack = []
        prev_boards = []
        move = ''
        prev_board = start_board
        turn = int(cur_move.ply()/2) + int(cur_move.turn() == chess.BLACK)
        spaces = parent.find(str(turn) + '.')
        cur_line = ' ' * (spaces + 2 + len(str(turn)))
        move_list.append(cur_line)
        fen_list.append(None)
        if cur_move.turn() == chess.WHITE:
            move = str(int(cur_move.ply()/2)) + '... '
            cur_line += move
        while not cur_move.is_end():
            if len(cur_move.variations) > 1:
                variation_stack.append(cur_move.variations[1:])
                for i in range(len(cur_move.variations[1:])):
                    prev_boards.append(cur_move.board())
            if cur_move.turn() == chess.BLACK:
                    move = str(int(cur_move.ply()/2) + 1) + '. '
                    cur_line += move
            move += uci_to_move(cur_move.board(), prev_board, cur_move.move)
            cur_line += uci_to_move(cur_move.board(), prev_board, cur_move.move) + ' '
            move_list.append(move)
            fen_list.append(cur_move.board().fen())
            move = ''
            prev_board = cur_move.board()
            cur_move = cur_move.next()
        if cur_move.turn() == chess.BLACK:
            move += str(int((cur_move.ply() + 1)/2)) + '. '
            cur_line += str(int((cur_move.ply() + 1)/2)) + '. '
        move += uci_to_move(cur_move.board(), prev_board, cur_move.move)
        cur_line += uci_to_move(cur_move.board(), prev_board, cur_move.move)
        move_list.append(move + '\n')
        fen_list.append(cur_move.board().fen())
        for i, variation in enumerate(variation_stack[::-1]):
            move_list, fen_list = parse_variations(variation, prev_boards[len(variation_stack) - 1 - i], move_list, fen_list, cur_line)
    return move_list, fen_list

def print_moves(moves):
    for move in moves[0:-1]:
        if move[len(move) - 1::] != '\n' and move[0] != ' ':
            print(move, end = ' ')
        else:
            print(move, end = '')
    print(moves[-1])

pgns = get_pgns()

games = []
for pgn in pgns:
    games.append([pgn[0], chess.pgn.read_game(io.StringIO(pgn[1]))])

parsed_games = {}
for game in games:
    moves, fens = parse_game(game[1])
    parsed_games[game[0]] = {'name': game[0], 'moves': moves, 'fens': fens}