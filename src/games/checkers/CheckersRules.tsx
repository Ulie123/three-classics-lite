export function CheckersRules() {
  return (
    <>
      <h3>Goal</h3>
      <p>Take all of your opponent's pieces, or leave them with no legal move on their turn.</p>

      <h3>Moving</h3>
      <ul>
        <li>Play only on the dark squares. Dark moves first.</li>
        <li>A man steps one square diagonally forward onto an empty square.</li>
        <li>A king steps one square diagonally in any direction. Kings don't fly across the board.</li>
      </ul>

      <h3>Capturing</h3>
      <ul>
        <li>Jump diagonally over an enemy piece next to you into the empty square behind it. The jumped piece is removed.</li>
        <li>Capturing is required: if any capture is available, you must take one.</li>
        <li>When there's a choice of captures, you may pick any of them, even a shorter one.</li>
        <li>After a jump, keep jumping with the same piece while you can. You can't jump the same piece twice.</li>
        <li>Men capture forward only; kings capture in both directions.</li>
      </ul>

      <h3>Crowning</h3>
      <ul>
        <li>A man that reaches the far row becomes a king, shown as a double piece with a crown.</li>
        <li>If that happens during a jump, the move ends there.</li>
      </ul>

      <h3>Draws</h3>
      <ul>
        <li>40 moves each with no capture and no man moved.</li>
        <li>The same position, with the same player to move, appearing three times.</li>
      </ul>

      <h3>Controls</h3>
      <ul>
        <li>Click a piece to see where it can go, then click a highlighted square. For a multi-jump, click each landing square in turn.</li>
        <li>Click the piece again or press Esc to change your mind before the move is complete.</li>
        <li>With the keyboard, use the arrow keys to move between squares and Enter to select.</li>
      </ul>
    </>
  );
}
