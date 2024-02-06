class MoveInfo():
    def __init__(self, move, space = ''):
        self.move = move
        self.space = space
        self.fen_dict = {}
        self.populate_fen_dict()
        self.ep = (not self.move.board().has_legal_en_passant() and
                   self.move.board().has_pseudo_legal_en_passant())
        self.comment = self.move.comment.replace(' ', '_') if self.move.comment else 'none'
        self.black_variation_start = move.turn() and move.starts_variation()
        self.interrupted_mainline = (self.move.is_mainline() and
                                     self.move.parent.parent != None and
                                     len(self.move.parent.parent.variations) > 1)
        if (self.move_turn() and int(self.turn_number()) < 10 and
            (self.move.is_mainline() or self.move.starts_variation())):
            self.space += ' '
        self.new_line = '\n' if ((self.move.is_mainline() and
                                 (self.move.turn() or
                                  len(self.move.parent.variations) > 1)) or
                                  self.move.is_end()) else ''
        self.move_num_san = self.move_turn() + (' ' if self.move_turn() else '') + self.move.san() + self.new_line

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