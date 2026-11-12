package com.threeclassics.connectfour;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public final class C4Golden {

    private C4Golden() {
    }

    public static List<Map<String, Object>> games(int count, long seed) {
        ConnectFourEngine engine = new ConnectFourEngine();
        Random random = new Random(seed);
        List<Map<String, Object>> games = new ArrayList<>();
        for (int g = 0; g < count; g++) {
            ConnectFourState state = engine.initialState();
            Map<String, Object> game = new LinkedHashMap<>();
            game.put("initial", state);
            List<Map<String, Object>> plies = new ArrayList<>();
            while (true) {
                Map<String, Object> ply = new LinkedHashMap<>();
                List<ConnectFourMove> legal = engine.legalMoves(state);
                ply.put("sideToMove", engine.sideToMove(state));
                ply.put("legal", legal);
                ply.put("outcome", engine.outcome(state).orElse(null));
                if (legal.isEmpty()) {
                    plies.add(ply);
                    break;
                }
                ply.put("eval", ConnectFourAi.evaluate(Bitboard.of(state)));
                ConnectFourMove move = legal.get(random.nextInt(legal.size()));
                ConnectFourState next = engine.apply(state, move, null);
                ply.put("move", move);
                ply.put("notation", engine.notation(move));
                ply.put("after", next);
                plies.add(ply);
                state = next;
            }
            game.put("plies", plies);
            games.add(game);
        }
        return games;
    }
}
