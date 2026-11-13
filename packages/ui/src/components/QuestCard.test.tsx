import { fireEvent, render, screen } from '@testing-library/react-native';

import { QuestCard } from './QuestCard';

describe('QuestCard', () => {
  it('opens details and requests completion', async () => {
    const onPress = jest.fn();
    const onToggleComplete = jest.fn();
    await render(
      <QuestCard
        detail="Due today"
        status="active"
        title="Pack lunch"
        onPress={onPress}
        onToggleComplete={onToggleComplete}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: /Pack lunch/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Complete' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onToggleComplete).toHaveBeenCalledTimes(1);
  });

  it('offers reopen for a completed quest', async () => {
    const onToggleComplete = jest.fn();
    await render(
      <QuestCard
        detail="Completed today"
        status="completed"
        title="Pack lunch"
        onToggleComplete={onToggleComplete}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Reopen' }));
    expect(onToggleComplete).toHaveBeenCalledTimes(1);
  });

  it('disables repeated lifecycle actions while persistence is pending', async () => {
    const onToggleComplete = jest.fn();
    await render(
      <QuestCard
        detail="Due today"
        mutationPending
        status="active"
        title="Only once"
        onToggleComplete={onToggleComplete}
      />,
    );
    const action = screen.getByRole('button', { name: 'Saving…' });
    expect(action).toBeDisabled();
    await fireEvent.press(action);
    expect(onToggleComplete).not.toHaveBeenCalled();
  });
});
