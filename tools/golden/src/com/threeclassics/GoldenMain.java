package com.threeclassics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.threeclassics.backgammon.BgGolden;
import com.threeclassics.checkers.CkGolden;
import com.threeclassics.connectfour.C4Golden;
import java.io.File;
import java.util.LinkedHashMap;
import java.util.Map;

/** Plays seeded random games with the Java engines and writes every observable result as JSON. */
public final class GoldenMain {

    public static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        Map<String, Object> all = new LinkedHashMap<>();
        all.put("connectFour", C4Golden.games(Integer.parseInt(args[1]), 101L));
        all.put("checkers", CkGolden.games(Integer.parseInt(args[2]), 202L));
        all.put("backgammon", BgGolden.games(Integer.parseInt(args[3]), 303L));
        JSON.writeValue(new File(args[0]), all);
    }

    /** FNV-1a over the compact JSON, so large lists can be compared without storing them. */
    public static String digest(Object value) {
        try {
            String text = JSON.writeValueAsString(value);
            int hash = 0x811c9dc5;
            for (int i = 0; i < text.length(); i++) {
                hash ^= text.charAt(i);
                hash *= 0x01000193;
            }
            return Integer.toHexString(hash);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
