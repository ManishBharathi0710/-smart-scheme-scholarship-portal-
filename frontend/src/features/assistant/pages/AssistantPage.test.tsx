import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AssistantPage } from './AssistantPage';
import { assistantApi } from '../api/assistant.api';
import { AssistantContextType } from '../../../types/assistant';

vi.mock('../api/assistant.api');

const mockConv = {
  id: 'conv-1',
  title: 'Scholarship eligibility question',
  contextType: 'RECOMMENDATION' as AssistantContextType,
  contextId: 'scheme-1',
  language: 'en',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockConversations = [mockConv];

describe('AssistantPage Component (Module 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assistantApi.getConversations).mockResolvedValue({
      items: mockConversations,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    vi.mocked(assistantApi.getConversation).mockResolvedValue({
      ...mockConv,
      messages: [
        {
          id: 'msg-1',
          role: 'USER',
          content: 'Why am I likely eligible?',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'ASSISTANT',
          content: 'Your current assessment is Likely Eligible based on matched income requirements.',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  });

  it('renders page header, safety disclaimer, and conversation history sidebar', async () => {
    render(
      <MemoryRouter>
        <AssistantPage />
      </MemoryRouter>
    );

    expect(screen.getByText('AI Scheme & Scholarship Assistant')).toBeInTheDocument();
    expect(screen.getByText(/Zero Hallucination Policy/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Scholarship eligibility question')).toBeInTheDocument();
    });
  });

  it('loads and displays conversation messages when clicking a conversation item', async () => {
    render(
      <MemoryRouter>
        <AssistantPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Scholarship eligibility question')).toBeInTheDocument();
    });

    const item = screen.getByText('Scholarship eligibility question');
    fireEvent.click(item);

    await waitFor(() => {
      expect(assistantApi.getConversation).toHaveBeenCalledWith('conv-1');
    });

    await waitFor(() => {
      expect(screen.getByText('Why am I likely eligible?')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Your current assessment is Likely Eligible based on matched income requirements.'
        )
      ).toBeInTheDocument();
    });
  });
});
