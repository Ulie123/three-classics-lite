package com.threeclassics.backgammon;

import com.threeclassics.core.Difficulty;
import com.threeclassics.core.Side;
import java.time.Duration;
import java.util.List;
import java.util.Random;

public final class HardCheck {
    public static void main(String[] args) {
        BackgammonEngine engine = new BackgammonEngine();
        BackgammonAi ai = new BackgammonAi();
        List<Integer> points = List.of(-2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2);
        int[][] rolls = {{6, 5}, {3, 1}, {6, 1}, {4, 2}, {5, 3}, {6, 4}, {2, 1}};
        for (int[] roll : rolls) {
            BackgammonState state = new BackgammonState(points, 0, 0, 0, 0, Side.P1, BackgammonState.Phase.MOVE,
                    List.of(roll[0], roll[1]), null, List.of(), null);
            for (Difficulty d : new Difficulty[] {Difficulty.HARD}) {
                BackgammonMove move = ai.chooseMove(state, d, new Random(1), Duration.ofSeconds(5));
                System.out.println(d + " " + engine.notation(move));
            }
        }
    }
}
