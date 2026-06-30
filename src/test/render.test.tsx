import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('App renders and navigates', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mounts on the Groups tab with the real group leader', () => {
    render(<App />);
    expect(screen.getByText('2026 Tracker')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Group A/i })).toBeInTheDocument();
    const groupA = screen.getByRole('region', { name: /Group A/ });
    expect(within(groupA).getAllByText('Mexico').length).toBeGreaterThan(0);
    // Mexico won Group A (9 pts) — from the bundled fallback feed
    expect(within(groupA).getAllByText('9').length).toBeGreaterThan(0);
  });

  it('switches to the Third place and Bracket views without errors', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: 'Third place' }));
    expect(screen.getByText('Best third-placed teams')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Bracket' }));
    expect(screen.getByText('Champion')).toBeInTheDocument();
    expect(screen.getByText('Round of 32')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();
  });

  it('played games are prefilled and locked', () => {
    render(<App />);
    const groupA = screen.getByRole('region', { name: /Group A/ });
    const inputs = within(groupA).getAllByRole('spinbutton') as HTMLInputElement[];
    // first fixture (Mexico 2-0 South Africa) is a finished game: prefilled + read-only
    expect(inputs[0]!.value).toBe('2');
    expect(inputs[1]!.value).toBe('0');
    expect(inputs[0]!.disabled).toBe(true);
  });

  it('lets you predict an unplayed knockout game', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: 'Bracket' }));
    const open = (screen.getAllByRole('spinbutton') as HTMLInputElement[]).filter((el) => !el.disabled);
    expect(open.length).toBeGreaterThan(0);
    await user.type(open[0]!, '3');
    expect(open[0]!.value).toBe('3');
  });

  it('offers sign-in with the major providers', async () => {
    const user = userEvent.setup();
    render(<App />);
    const signIn = await screen.findByRole('button', { name: 'Sign in' });
    await user.click(signIn);
    expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
  });
});
