package com.threeclassics.backgammon;

import com.threeclassics.GoldenMain;
import com.threeclassics.RecordingRandom;
import com.threeclassics.core.Side;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public final class BgGolden {

    private static final int FULL_LIMIT = 16;

    private BgGolden() {
    }

    public static List<Map<String, Object>> games(int count, long seed) {
        BackgammonEngine engine = new BackgammonEngine();
        Random picker = new Random(seed);
        RecordingRandom dice = new RecordingRandom(seed * 31);
        List<Map<String, Object>> games = new ArrayList<>();
        for (int g = 0; g < count; g++) {
            BackgammonState state = engine.initialState();
            Map<String, Object> game = new LinkedHashMap<>();
            game.put("initial", state);
            List<Map<String, Object>> plies = new ArrayList<>();
            while (true) {
                Map<String, Object> ply = new LinkedHashMap<>();
                List<BackgammonMove> legal = engine.legalMoves(state);
                List<BackgammonMove> client = engine.clientMoves(state);
                TurnGraph graph = engine.moveGraph(state);
                ply.put("sideToMove", engine.sideToMove(state));
                ply.put("outcome", engine.outcome(state).orElse(null));
                ply.put("pips", List.of(BackgammonEngine.pipCount(state, Side.P1), BackgammonEngine.pipCount(state, Side.P2)));
                ply.put("legalCount", legal.size());
                ply.put("legalDigest", GoldenMain.digest(legal));
                ply.put("clientCount", client.size());
                ply.put("clientDigest", GoldenMain.digest(client));
                if (client.size() <= FULL_LIMIT) ply.put("client", client);
                ply.put("graphDigest", GoldenMain.digest(graph));
                if (graph != null && graph.nodes().size() <= FULL_LIMIT) ply.put("graph", graph);
                if (legal.isEmpty()) {
                    plies.add(ply);
                    break;
                }
                if (state.phase() == BackgammonState.Phase.MOVE) {
                    Position position = Position.of(state, state.sideToMove());
                    ply.put("eval", BackgammonAi.evaluate(position));
                    List<Double> evals = new ArrayList<>();
                    for (BackgammonMove move : client) {
                        evals.add(BackgammonAi.evaluate(Turns.result(position, move.steps())));
                    }
                    ply.put("clientEvals", evals);
                }
                BackgammonMove move = legal.get(picker.nextInt(legal.size()));
                BackgammonState next = engine.apply(state, move, dice);
                BackgammonMove recorded = engine.recorded(state, move, next);
                ply.put("move", move);
                ply.put("rolls", dice.drain());
                ply.put("recorded", recorded);
                ply.put("notation", engine.notation(recorded));
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
