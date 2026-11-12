export function BackgammonRules() {
  return (
    <>
      <h3>Goal</h3>
      <p>Bring all 15 of your checkers into your home board (bottom right), then bear them all off before your opponent does.</p>

      <h3>Starting</h3>
      <ul>
        <li>Each side rolls one die. The higher roll starts and plays both of those dice. Ties roll again.</li>
        <li>After that, players take turns rolling two dice.</li>
      </ul>

      <h3>Moving</h3>
      <ul>
        <li>Your checkers travel counter-clockwise: across the top from the right, down the left, then along the bottom into home.</li>
        <li>Each die is a separate move. One checker can use both dice if it can land after the first one.</li>
        <li>Doubles are played four times.</li>
        <li>You may land on an empty point, your own point, or a point with a single opposing checker, which sends it to the bar. Two or more opposing checkers block a point, but you can jump over it.</li>
        <li>Use as many dice as you legally can. If only one die can be played, play the larger one if it fits. With no legal move, the turn passes.</li>
      </ul>

      <h3>The bar</h3>
      <ul>
        <li>Checkers on the bar must come back in first, into your opponent's home board: a 3 enters on their 3-point.</li>
        <li>If all six of those points are blocked you're closed out, and your turn passes until one opens.</li>
      </ul>

      <h3>Bearing off</h3>
      <ul>
        <li>Once all 15 checkers are home, a die removes a checker from the matching point.</li>
        <li>With no checker there, you must move one from a higher point. If there are none higher, bear off from your highest point.</li>
        <li>If one of your checkers is hit, it must come back around before you can bear off again.</li>
      </ul>

      <h3>Scoring</h3>
      <ul>
        <li>A single game is 1 point. If your opponent hasn't borne off any checkers, it's a gammon (2). If they also still have a checker on the bar or in your home board, it's a backgammon (3).</li>
        <li>There's no doubling cube in this version.</li>
      </ul>

      <h3>Controls</h3>
      <ul>
        <li>Roll, click a checker (or the bar) to see where it can go, then click a glowing point or the tray.</li>
        <li>Undo takes back a step. Confirm ends your turn once all your dice are played.</li>
      </ul>
    </>
  );
}
