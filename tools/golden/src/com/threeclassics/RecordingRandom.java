package com.threeclassics;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.random.RandomGenerator;

/** A seeded generator that remembers every nextInt result, so another implementation can replay them. */
public final class RecordingRandom implements RandomGenerator {

    private final Random delegate;
    private final List<Integer> ints = new ArrayList<>();

    public RecordingRandom(long seed) {
        this.delegate = new Random(seed);
    }

    @Override
    public long nextLong() {
        return delegate.nextLong();
    }

    @Override
    public int nextInt(int bound) {
        int value = delegate.nextInt(bound);
        ints.add(value);
        return value;
    }

    public List<Integer> drain() {
        List<Integer> copy = List.copyOf(ints);
        ints.clear();
        return copy;
    }
}
