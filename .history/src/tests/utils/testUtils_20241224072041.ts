export const setupBattleTest = async () => {
  const { container } = renderWithProviders(<BattleMode />);
  
  // Click the search button
  fireEvent.click(screen.getByTestId('search-opponent-button'));
  
  // Wait for opponent search
  await waitFor(() => {
    expect(screen.getByText(/Searching for opponent\.\.\./i)).toBeInTheDocument();
  });
  
  // Simulate battle initialization
  act(() => {
    jest.advanceTimersByTime(4500); // Combined timer advances
  });
  
  await waitFor(() => {
    expect(screen.getByTestId('battle-arena')).toBeInTheDocument();
  });
  
  return { container };
};

export const simulateBattleAction = async (actionType: BattleAction, answer: string) => {
  await waitFor(() => {
    const actionCard = screen.getByTestId(`action-card-${actionType.toLowerCase()}`);
    fireEvent.click(actionCard);
  });

  act(() => {
    jest.advanceTimersByTime(10000);
  });

  await waitFor(() => {
    fireEvent.click(screen.getByText(answer));
  });

  act(() => {
    jest.advanceTimersByTime(5000);
  });
}; 