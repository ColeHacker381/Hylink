import { fireEvent, render, screen } from '@testing-library/react-native';

import { QuickAddSheet } from './QuickAddSheet';

describe('QuickAddSheet', () => {
  it('keeps save disabled until a title is present, then submits a trimmed title', async () => {
    const onSave = jest.fn();
    await render(<QuickAddSheet onClose={jest.fn()} onSave={onSave} />);

    const saveButton = screen.getByRole('button', { name: 'Save quest' });
    expect(saveButton).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Quest title'), '  Pack lunch  ');
    await fireEvent.press(saveButton);

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Pack lunch' }));
  });

  it('closes from the cancel action', async () => {
    const onClose = jest.fn();
    await render(<QuickAddSheet onClose={onClose} onSave={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('reveals advanced options and submits selected details', async () => {
    const onSave = jest.fn();
    await render(<QuickAddSheet onClose={jest.fn()} onSave={onSave} />);
    await fireEvent.changeText(screen.getByLabelText('Quest title'), 'Train');
    await fireEvent.press(screen.getByRole('button', { name: 'Advanced options' }));
    await fireEvent.press(screen.getByRole('button', { name: 'epic' }));
    await fireEvent.changeText(screen.getByLabelText('Due date'), '2026-11-20');
    await fireEvent.press(screen.getByRole('button', { name: 'Save quest' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Train',
      difficulty: 'epic',
      dueAt: expect.any(String),
    }));
  });
});

