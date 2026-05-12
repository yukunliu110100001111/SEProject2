import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PasswordField from '../components/PasswordField';

describe('PasswordField', () => {
  it('renders a masked password input by default', () => {
    render(
      <PasswordField
        value="secret"
        onChange={() => {}}
        placeholder="Password"
        visible={false}
        onToggle={() => {}}
      />
    );

    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
  });

  it('renders plain text mode when visible is true', () => {
    render(
      <PasswordField
        value="secret"
        onChange={() => {}}
        placeholder="Password"
        visible
        onToggle={() => {}}
      />
    );

    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('calls handlers for input changes and visibility toggle', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onToggle = vi.fn();

    render(
      <PasswordField
        value=""
        onChange={onChange}
        placeholder="Password"
        visible={false}
        onToggle={onToggle}
      />
    );

    await user.type(screen.getByPlaceholderText('Password'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
