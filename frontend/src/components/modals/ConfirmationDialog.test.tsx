import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmationDialog from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const setup = (overrides = {}) => {
    const props = {
      open: true,
      title: 'Test Title',
      content: 'Test Content',
      onConfirm: vi.fn(),
      onClose: vi.fn(),
      ...overrides,
    };
    return { ...render(<ConfirmationDialog {...props} />), props };
  };

  describe('title', () => {
    it('displays the provided title', () => {
      setup({ title: 'Custom Title' });
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('displays the provided content', () => {
      setup({ content: 'Custom Content' });
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });
  });

  describe('open', () => {
    it('shows the dialog when open is true', () => {
      setup({ open: true });
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('hides the dialog when open is false', () => {
      setup({ open: false });
      expect(screen.queryByText('Test Title')).toBeNull();
    });
  });

  describe('onClose', () => {
    it('triggers onClose when clicking outside the dialog', () => {
      const { props } = setup();
      fireEvent.mouseDown(document);
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('onConfirm', () => {
    it('triggers onConfirm and onClose when Continue is clicked', () => {
      const { props } = setup();
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(props.onConfirm).toHaveBeenCalledTimes(1);
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
