export function ConnectFourRules() {
  return (
    <>
      <h3>Goal</h3>
      <p>Be the first to line up four of your discs in a row: across, up and down, or on either diagonal.</p>

      <h3>Your turn</h3>
      <ul>
        <li>Pick a column. Your disc drops to the lowest empty slot in it.</li>
        <li>You can't play into a full column, and discs never move once they land.</li>
        <li>Coral always moves first. Choose Go first or Go second before you start; Play again swaps who starts.</li>
      </ul>

      <h3>End of the game</h3>
      <ul>
        <li>Four or more in a row wins at once. A line of five counts too.</li>
        <li>If all 42 slots fill up with no line of four, the game is a draw.</li>
      </ul>

      <h3>Controls</h3>
      <ul>
        <li>Hover or tab to a column to preview your disc, then click or press Enter to drop it.</li>
        <li>Use ← and → to move between columns.</li>
      </ul>
    </>
  );
}
