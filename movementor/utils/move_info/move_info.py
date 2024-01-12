# import chess, chess.engine
import random

# engine = chess.engine.SimpleEngine.popen_uci('movementor\stockfish-windows-x86-64-avx2.exe')

class MoveInfo():
    def __init__(self, move, space = ''):
        self.move = move
        # self.eval = engine.analyse(self.move.board(), chess.engine.Limit(time=.01))['score'].white().score(mate_score=10000)/100
        self.eval = random.uniform(-5, 5)
        self.space = space
        self.fen_dict = {}
        self.populate_fen_dict()
        self.black_variation_start = move.turn() and move.starts_variation()
        self.interrupted_mainline = (self.move.is_mainline() and
                                     self.move.parent.parent != None and
                                     len(self.move.parent.parent.variations) > 1)
        self.new_line = '\n' if ((self.move.is_mainline() and
                                  (self.move.turn() or
                                  len(self.move.parent.variations) > 1)) or
                                  self.move.is_end()) else ''
        self.move_num_san = self.move_turn() + ' ' + self.move.san() + self.new_line

    def turn_number(self):
        return str(int(self.move.ply()/2) + int(not self.move.turn()))

    def move_turn(self):
        ans = self.turn_number()
        if not self.move.turn():
                return ans + '.'
        elif self.black_variation_start or self.interrupted_mainline:
            return ans + '...'
        return ''
                
    def populate_fen_dict(self):
        self.fen_dict['own'] = self.move.board().fen().replace(' ','_')
        if self.move.parent:
            self.fen_dict['parent'] = self.move.parent.board().fen().replace(' ','_')
        else:
            self.fen_dict['parent'] = self.move.board().fen().replace(' ','_')
        if self.move.variations:
            self.fen_dict['child_1'] = self.move.variations[0].board().fen().replace(' ','_')
            if len(self.move.variations) > 1:
                self.fen_dict['child_2'] = self.move.variations[1].board().fen().replace(' ','_')
            else:
                self.fen_dict['child_2'] = self.fen_dict['own']
        else:
            self.fen_dict['child_1'] = self.fen_dict['own']
            self.fen_dict['child_2'] = self.fen_dict['own']