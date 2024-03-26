from .move_info.move_info import MoveInfo
class PGNParser():
    def __init__(self, pgn, move_list = []):
        self.pgn = pgn
        self.move_list = move_list
        self.parse_pgn()

    def insert_bars(self):
        for i, cur_move in enumerate(self.move_list[::-1]):
            index = len(self.move_list) - i - 1
            if not cur_move.move.is_mainline() and cur_move.space:
                for prev_move in [move_info for move_info in self.move_list[index - 1:0:-1]]:
                    if ((int(prev_move.turn_number()) <= int(cur_move.turn_number())) and
                        (prev_move.move.turn() == cur_move.move.turn())):
                        break
                    if prev_move.space:
                        prev_move.space = prev_move.space[0:len(cur_move.space)] + '|' + prev_move.space[len(cur_move.space) + 1:]

    def parse_variations(self, variations, parent_line):
        first_moves = []
        for cur_move in variations:
            variation_stack = []
            turn = str(int(cur_move.ply()/2) + int(not cur_move.turn()))
            spaces = parent_line.find(turn + '.')
            cur_line = ' ' * (spaces + 2 + len(turn))
            space = cur_line
            while not cur_move.is_end():
                if len(cur_move.variations) > 1:
                    variation_stack.append(cur_move.variations[1:])
                cur_move_info = MoveInfo(cur_move, space=space)
                self.move_list.append(cur_move_info)
                if cur_move_info.move.starts_variation():
                    first_moves.append(cur_move_info)
                cur_line += self.move_list[-1].move_num_san + ' '
                space = ''
                cur_move = cur_move.next()
            cur_move_info = MoveInfo(cur_move, space=space)
            self.move_list.append(cur_move_info)
            if cur_move_info.move.starts_variation():
                first_moves.append(cur_move_info)
            cur_line += self.move_list[-1].move_num_san
            for variation in variation_stack[::-1]:
                self.parse_variations(variation, cur_line)
        if len(first_moves) > 1:
            prev_move = first_moves[0]
            for move in first_moves[1:]:
                move.fen_dict['parent'] = prev_move.move.board().fen().replace(' ','_')
                prev_move.fen_dict['child_2'] = move.move.board().fen().replace(' ','_')
                prev_move = move

    def parse_pgn(self):
        cur_move = self.pgn.variations[0]
        variations = []
        cur_line  = ''
        while True:
            if len(cur_move.variations) > 1:
                variations = cur_move.variations[1:]
            self.move_list.append(MoveInfo(cur_move))
            if cur_move.turn() and cur_line:
                cur_line += ' '
            else:
                cur_line = ''
            cur_line += self.move_list[-1].move_num_san
            while variations:
                cur_move = cur_move.next()
                self.move_list.append(MoveInfo(cur_move))
                if cur_move.turn() and cur_line:
                    cur_line += ' '
                else:
                    cur_line = ''
                cur_line += self.move_list[-1].move_num_san
                self.parse_variations(variations, cur_line)
                cur_line = ''
                if len(cur_move.variations) > 1:
                    variations = cur_move.variations[1:]
                else:
                    variations = []
            if cur_move.is_end():
                break
            cur_move = cur_move.next()
        self.insert_bars()