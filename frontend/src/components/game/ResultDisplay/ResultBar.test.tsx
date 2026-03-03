import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ResultBar from './ResultBar';

describe('ResultBar Component', () => {
  const renderBar = (points: number, goalPoints: number) =>
    render(<ResultBar points={points} goalPoints={goalPoints} />);

  it('shows "Parked" at 0 points', () => {
    renderBar(0, 300);
    expect(screen.getByText('Parked')).toBeInTheDocument();
    expect(screen.getByText('0 / 300 pts')).toBeInTheDocument();
  });

  it('shows "Good Start" between 1% and 24%', () => {
    renderBar(30, 300); // 10%
    expect(screen.getByText('Good Start')).toBeInTheDocument();
  });

  it('shows "Gaining Speed" at 25%', () => {
    renderBar(75, 300); // 25%
    expect(screen.getByText('Gaining Speed')).toBeInTheDocument();
  });

  it('shows "Cruising" at 50%', () => {
    renderBar(150, 300); // 50%
    expect(screen.getByText('Cruising')).toBeInTheDocument();
  });

  it('shows "In the Fast Lane" at 75%', () => {
    renderBar(225, 300); // 75%
    expect(screen.getByText('In the Fast Lane')).toBeInTheDocument();
  });

  it('shows "High Performance" at 90%', () => {
    renderBar(270, 300); // 90%
    expect(screen.getByText('High Performance')).toBeInTheDocument();
  });

  it('shows "Full Throttle" at exactly 100%', () => {
    renderBar(300, 300); // 100%
    expect(screen.getByText('Full Throttle')).toBeInTheDocument();
  });

  it('shows "Supersonic" above 115%', () => {
    renderBar(360, 300); // 120%
    expect(screen.getByText('Supersonic')).toBeInTheDocument();
  });

  it('renders the points fraction correctly', () => {
    renderBar(120, 400);
    expect(screen.getByText('120 / 400 pts')).toBeInTheDocument();
  });
});
