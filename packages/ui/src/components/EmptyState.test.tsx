import { render, screen } from '@testing-library/react-native';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders its accessible title and guidance', async () => {
    await render(<EmptyState title="No quests" message="Capture your first quest." />);

    expect(screen.getByLabelText('No quests')).toBeTruthy();
    expect(screen.getByText('Capture your first quest.')).toBeTruthy();
  });
});

