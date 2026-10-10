import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AssistantPanel } from './AssistantPanel';
import { assistantApi } from '../api/assistant.api';
import { AssistantChatResponse } from '../../../types/assistant';

vi.mock('../api/assistant.api');

const mockResponse: AssistantChatResponse = {
  conversationId: 'conv-123',
  messageId: 'msg-456',
  answer: 'Based on verified records, this scholarship provides an annual tuition allowance of ₹15,000.',
  intent: 'EXPLAIN_SCHEME',
  language: 'en',
  confidence: 'GROUNDED',
  sources: [
    {
      type: 'SCHEME',
      id: 'scheme-1',
      title: 'Post-Matric Scholarship for Minorities',
      url: 'https://scholarships.gov.in',
    },
  ],
  actions: [
    {
      type: 'OPEN_OFFICIAL_URL',
      label: 'Open Official Application Portal',
      url: 'https://scholarships.gov.in/apply',
    },
  ],
};

describe('AssistantPanel Component (Module 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assistantApi.getConversations).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });
    vi.mocked(assistantApi.sendMessage).mockResolvedValue(mockResponse);
  });

  it('renders welcome greeting, suggested questions, and official disclaimer', () => {
    render(
      <MemoryRouter>
        <AssistantPanel />
      </MemoryRouter>
    );

    expect(screen.getByText('AI Scheme & Scholarship Assistant')).toBeInTheDocument();
    expect(screen.getByText('How can I assist you today?')).toBeInTheDocument();
    expect(
      screen.getByText(/AI responses help explain verified scheme information/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Which scholarships match my education profile\?/i })
    ).toBeInTheDocument();
  });

  it('sends message on suggested question click and renders grounded response with sources and actions', async () => {
    render(
      <MemoryRouter>
        <AssistantPanel />
      </MemoryRouter>
    );

    const questionBtn = screen.getByRole('button', {
      name: /Which scholarships match my education profile\?/i,
    });
    fireEvent.click(questionBtn);

    await waitFor(() => {
      expect(assistantApi.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Which scholarships match my education profile?',
          context: expect.objectContaining({ language: 'en' }),
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          'Based on verified records, this scholarship provides an annual tuition allowance of ₹15,000.'
        )
      ).toBeInTheDocument();
    });

    // Verification of grounding badge and source pill
    expect(screen.getByText('Grounded in verified portal data')).toBeInTheDocument();
    expect(screen.getByText('Post-Matric Scholarship for Minorities')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Open Official Application Portal/i })
    ).toBeInTheDocument();
  });

  it('supports selecting different languages from the language dropdown', async () => {
    render(
      <MemoryRouter>
        <AssistantPanel />
      </MemoryRouter>
    );

    const langSelect = screen.getByLabelText(/Select assistant language/i);
    expect(langSelect).toBeInTheDocument();

    fireEvent.change(langSelect, { target: { value: 'ta' } });

    const input = screen.getByPlaceholderText(/Ask a question about schemes/i);
    fireEvent.change(input, { target: { value: 'வணக்கம்' } });

    const sendBtn = screen.getByLabelText(/Send message/i);
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(assistantApi.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'வணக்கம்',
          context: expect.objectContaining({ language: 'ta' }),
        })
      );
    });
  });
});
