import { render, screen, within } from '@testing-library/react';
import App from './App';

test('renders application title', () => {
  render(<App />);
  const header = screen.getByRole('banner');
  const headingElement = within(header).getByText(/StayBillPro/i);
  expect(headingElement).toBeInTheDocument();
});
