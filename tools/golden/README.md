# Golden games from the Java engines

This small Java program plays seeded random games with the original project's engines and writes
everything observable as JSON: legal moves, outcomes, notation, evaluation scores, the dice each roll
used, and the resulting positions. `src/engine/parity.test.ts` replays the games through the
TypeScript ports and checks that every one of those matches.

It needs the compiled backend of [Three Classics](https://github.com/Ulie123/three-classics) and
Jackson on the classpath. The helpers sit in the engines' own packages so they can call the
package-private evaluation functions.

To regenerate (Git Bash on Windows; use `:` instead of `;` in the classpath elsewhere):

```bash
cd ../three-classics/backend && ./mvnw -q compile && cd -
```

```bash
M=~/.m2/repository/com/fasterxml/jackson/core
CP="../three-classics/backend/target/classes;$M/jackson-databind/2.21.4/jackson-databind-2.21.4.jar;$M/jackson-core/2.21.4/jackson-core-2.21.4.jar;$M/jackson-annotations/2.21/jackson-annotations-2.21.jar"
javac -d tools/golden/out -cp "$CP" $(find tools/golden/src -name "*.java")
java -cp "tools/golden/out;$CP" com.threeclassics.GoldenMain golden.json 40 25 14
gzip -9 -c golden.json > src/engine/golden/java-games.json.gz
```

The three numbers are how many Connect Four, checkers and backgammon games to play.
