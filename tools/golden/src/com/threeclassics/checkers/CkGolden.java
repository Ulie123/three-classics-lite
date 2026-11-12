package com.threeclassics.checkers;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public final class CkGolden {

    private CkGolden() {
    }

    public static List<Map<String, Object>> games(int count, long seed) {
        CheckersEngine engine = new CheckersEngine();
        Random random = new Random(seed);
        List<Map<String, Object>> games = new ArrayList<>();
        for (int g = 0; g < count; g++) {
            CheckersState state = engine.initialState();
            Map<String, Object> game = new LinkedHashMap<>();
            game.put("initial", state);
            List<Map<String, Object>> plies = new ArrayList<>();
            while (true) {
                Map<String, Object> ply = new LinkedHashMap<>();
                List<CheckersMove> legal = engine.legalMoves(state);
                ply.put("sideToMove", engine.sideToMove(state));
                ply.put("legal", legal);
                ply.put("outcome", engine.outcome(state).orElse(null));
                if (legal.isEmpty()) {
                    plies.add(ply);
                    break;
                }
                char[] board = state.board().toCharArray();
                ply.put("eval", CheckersAi.evaluate(board, state.sideToMove(), false));
                ply.put("evalRich", CheckersAi.evaluate(board, state.sideToMove(), true));
                CheckersMove move = legal.get(random.nextInt(legal.size()));
                CheckersState next = engine.apply(state, move, null);
                ply.put("move", move);
                ply.put("notation", engine.notation(move));
                Map<String, Object> after = new LinkedHashMap<>();
                after.put("board", next.board());
                after.put("sideToMove", next.sideToMove());
                after.put("quietPlies", next.quietPlies());
                after.put("positions", next.positions().size());
                after.put("lastPosition", next.positions().getLast());
                after.put("lastMove", next.lastMove());
                ply.put("after", after);
                plies.add(ply);
                state = next;
            }
            game.put("plies", plies);
            game.put("final", state);
            games.add(game);
        }
        return games;
    }
}
