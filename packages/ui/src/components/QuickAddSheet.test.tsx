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

    expect(onSave).toHaveBeenCalledWith('Pack lunch');
  });

  it('closes from the cancel action', async () => {
    const onClose = jest.fn();
    await render(<QuickAddSheet onClose={onClose} onSave={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a confirmation state without another save action', async () => {
    await render(
      <QuickAddSheet
        confirmationMessage="Quest captured."
        initialTitle="Pack lunch"
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Quest captured.');
    expect(screen.queryByRole('button', { name: 'Save quest' })).toBeNull();
  });
});

