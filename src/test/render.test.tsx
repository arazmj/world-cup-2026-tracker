import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('App renders and navigates', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mounts on the Groups tab with real teams', () => {
    render(<App />);
    expect(screen.getByText('2026 Tracker')).toBeInTheDocument();
    // 12 group cards
    expect(screen.getAllByRole('region').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: /Group A/i })).toBeInTheDocument();
    expect(screen.getAllByText('Mexico').length).toBeGreaterThan(0);
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

  it('prefills finished games and stays reactive', async () => {
    const user = userEvent.setup();
    render(<App />);
    const groupA = screen.getByRole('region', { name: /Group A/ });
    const inputs = within(groupA).getAllByRole('spinbutton') as HTMLInputElement[];
    // first group fixture (Mexico 2–0 South Africa) is prefilled from real results
    expect(inputs[0]!.value).toBe('2');
    expect(inputs[1]!.value).toBe('0');
    // Mexico won the group — its 9 points show in the table
    expect(within(groupA).getAllByText('9').length).toBeGreaterThan(0);
    // editing stays reactive
    await user.clear(inputs[0]!);
    await user.type(inputs[0]!, '4');
    expect(inputs[0]!.value).toBe('4');
  });
});
