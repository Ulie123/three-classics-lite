import type { Difficulty } from '../../api/types';
import type { Segment } from '../../components/SegmentedControl';

export const DIFFICULTIES: Segment<Difficulty>[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];
