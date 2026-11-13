import { fireEvent, render, screen } from '@testing-library/react-native';

import { QuickAddSheet } from './QuickAddSheet';

jest.mock('@react-native-community/datetimepicker', () => {
  const { Pressable, Text } = jest.requireActual('react-native') as typeof import('react-native');
  return function MockDateTimePicker({ onChange }: { readonly onChange: (event: object, date: Date) => void }) {
    return (
      <Pressable accessibilityLabel="Native date picker" onPress={() => onChange({}, new Date('2026-11-20T12:00:00'))}>
        <Text>Native date picker</Text>
      </Pressable>
    );
  };
});

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
    await fireEvent.press(screen.getByRole('button', { name: 'Choose due date' }));
    await fireEvent.press(screen.getByLabelText('Native date picker'));
    await fireEvent.press(screen.getByRole('button', { name: 'Save quest' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Train',
      difficulty: 'epic',
      dueAt: expect.any(String),
    }));
  });

  it('shows a failed save, stays open, and allows a retry', async () => {
    const onSave = jest.fn()
      .mockRejectedValueOnce(new Error('Could not save this quest.'))
      .mockResolvedValueOnce(undefined);
    await render(<QuickAddSheet onClose={jest.fn()} onSave={onSave} />);
    await fireEvent.changeText(screen.getByLabelText('Quest title'), 'Retry me');
    const save = screen.getByRole('button', { name: 'Save quest' });

    await fireEvent.press(save);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save this quest.');
    expect(save).not.toBeDisabled();
    await fireEvent.press(save);
    expect(onSave).toHaveBeenCalledTimes(2);
  });
});

