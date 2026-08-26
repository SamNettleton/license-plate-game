import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsModal from './SettingsModal';
import { useSettings } from '@/context/SettingsContext';

vi.mock('@/context/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

vi.mock('@components', async () => {
  const actual = await vi.importActual<object>('@components');
  return {
    ...actual,
    useMediaQuery: vi.fn().mockReturnValue(false),
  };
});

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  maxDisplayNameLength: 20,
};

const mockUpdateSettings = vi.fn();

describe('SettingsModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      settings: {
        playerId: 'mock-uuid-1234',
        displayName: 'Road Tripper',
        isDarkTheme: true,
        displayTimeOption: 'resultsOnly',
      },
      updateSettings: mockUpdateSettings,
    });
  });

  describe('visibility', () => {
    it('renders nothing visible when closed', () => {
      render(<SettingsModal {...defaultProps} open={false} />);
      expect(screen.queryByRole('heading', { name: /settings/i })).not.toBeInTheDocument();
    });

    it('renders the modal title and controls when open', () => {
      render(<SettingsModal {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /display time/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /dark mode/i })).toBeInTheDocument();
    });
  });

  describe('display name input', () => {
    it('populates with current settings display name', () => {
      render(<SettingsModal {...defaultProps} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Road Tripper');
    });

    it('respects custom maxDisplayNameLength prop', () => {
      render(<SettingsModal {...defaultProps} maxDisplayNameLength={15} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '15');
    });

    it('sanitizes leading/trailing whitespace and saves display name on blur', () => {
      render(<SettingsModal {...defaultProps} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '  Speedy Driver  ' } });
      fireEvent.blur(input);

      expect(input.value).toBe('Speedy Driver');
      expect(mockUpdateSettings).toHaveBeenCalledWith({ displayName: 'Speedy Driver' });
    });

    it('falls back to "Anonymous Traveler" on blur if input is cleared or only contains whitespace', () => {
      render(<SettingsModal {...defaultProps} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.blur(input);

      expect(input.value).toBe('Anonymous Traveler');
      expect(mockUpdateSettings).toHaveBeenCalledWith({ displayName: 'Anonymous Traveler' });
    });

    describe('end adornments', () => {
      it('shows the clear button when input has text and clears text when clicked', () => {
        render(<SettingsModal {...defaultProps} />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        const clearButton = screen.getByRole('button', { name: /clear display name/i });

        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);

        expect(input.value).toBe('');
        expect(
          screen.queryByRole('button', { name: /clear display name/i }),
        ).not.toBeInTheDocument();
      });

      it('does not display the character counter when below the threshold', () => {
        (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
          settings: {
            playerId: 'mock-uuid-1234',
            displayName: 'Short',
            isDarkTheme: true,
            displayTimeOption: 'resultsOnly',
          },
          updateSettings: mockUpdateSettings,
        });

        render(<SettingsModal {...defaultProps} maxDisplayNameLength={20} />);
        expect(screen.queryByText(/5\/20/)).not.toBeInTheDocument();
      });

      it('displays the character counter when reaching or exceeding the threshold', () => {
        const fifteenChars = '123456789012345';
        (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
          settings: {
            playerId: 'mock-uuid-1234',
            displayName: fifteenChars,
            isDarkTheme: true,
            displayTimeOption: 'resultsOnly',
          },
          updateSettings: mockUpdateSettings,
        });

        render(<SettingsModal {...defaultProps} maxDisplayNameLength={20} />);
        expect(screen.getByText('15/20')).toBeInTheDocument();
      });

      it('updates character counter dynamically as user types near the limit', () => {
        render(<SettingsModal {...defaultProps} maxDisplayNameLength={20} />);
        const input = screen.getByRole('textbox');

        fireEvent.change(input, { target: { value: 'A'.repeat(18) } });

        expect(screen.getByText('18/20')).toBeInTheDocument();
      });
    });
  });

  describe('display time select', () => {
    it('reflects current display time setting state', () => {
      render(<SettingsModal {...defaultProps} />);
      const select = screen.getByRole('combobox', { name: /display time/i });
      expect(select).toHaveTextContent('In Results Only');
    });

    it('falls back to "In Results Only" if displayTimeOption is missing or undefined', () => {
      (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        settings: {
          playerId: 'mock-uuid-1234',
          displayName: 'Road Tripper',
          isDarkTheme: true,
          displayTimeOption: undefined,
        },
        updateSettings: mockUpdateSettings,
      });

      render(<SettingsModal {...defaultProps} />);
      const select = screen.getByRole('combobox', { name: /display time/i });
      expect(select).toHaveTextContent('In Results Only');
    });

    it('calls updateSettings with selected option when changed', () => {
      render(<SettingsModal {...defaultProps} />);
      const select = screen.getByRole('combobox', { name: /display time/i });

      // Open the select dropdown
      fireEvent.mouseDown(select);

      // Select 'gameAndResults' option
      const option = screen.getByRole('option', { name: /in game and results/i });
      fireEvent.click(option);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ displayTimeOption: 'gameAndResults' });
    });
  });

  describe('dark mode toggle', () => {
    it('reflects current dark theme setting state', () => {
      render(<SettingsModal {...defaultProps} />);
      const switchInput = screen.getByRole('checkbox', { name: /dark mode/i });
      expect(switchInput).toBeChecked();
    });

    it('calls updateSettings with toggled boolean value when clicked', () => {
      render(<SettingsModal {...defaultProps} />);
      const switchInput = screen.getByRole('checkbox', { name: /dark mode/i });

      fireEvent.click(switchInput);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ isDarkTheme: false });
    });
  });

  describe('close button', () => {
    it('saves current display name and calls onClose when the X button is clicked', () => {
      const onClose = vi.fn();
      render(<SettingsModal {...defaultProps} onClose={onClose} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Navigator Sam' } });

      const closeButton = screen.getByRole('button', { name: /close settings/i });
      fireEvent.click(closeButton);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ displayName: 'Navigator Sam' });
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
