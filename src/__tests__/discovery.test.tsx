import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptGallery } from '../components/prompts/PromptGallery';
import { Prompt } from '../types/prompt';

// Test Data
const TEST_PROMPTS: Prompt[] = [
    {
        id: '1',
        title: 'Top Rated Prompt',
        description: 'Desc 1',
        content: 'Content 1',
        rating_avg: 5.0,
        rating_count: 10,
        category: 'Category A',
        tags: ['Tag1'],
        created_at: '2023-01-01',
        is_trending: false
    },
    {
        id: '2',
        title: 'Trending Prompt',
        description: 'Desc 2',
        content: 'Content 2',
        rating_avg: 4.0,
        rating_count: 100,
        category: 'Category B',
        tags: ['Tag2'],
        created_at: '2023-01-02',
        is_trending: true
    },
    {
        id: '3',
        title: 'Newest Prompt',
        description: 'Desc 3',
        content: 'Content 3',
        rating_avg: 3.0,
        rating_count: 5,
        category: 'Category A',
        tags: ['Tag3'],
        created_at: '2023-12-31', // Newest
        is_trending: false
    }
];

describe('DISC Features', () => {

    it('DISC-01: Displays prompts in a gallery layout', () => {
        render(<PromptGallery prompts={TEST_PROMPTS} />);

        // Check for all titles
        expect(screen.getByText('Top Rated Prompt')).toBeInTheDocument();
        expect(screen.getByText('Trending Prompt')).toBeInTheDocument();
        expect(screen.getByText('Newest Prompt')).toBeInTheDocument();

        // Check for ratings
        expect(screen.getByText('5.0')).toBeInTheDocument();
    });

    it('DISC-02: Sorts by Top Rated', async () => {
        render(<PromptGallery prompts={TEST_PROMPTS} />);
        const user = userEvent.setup();

        // Open Sort Dropdown
        const sortSelect = screen.getByRole('combobox', { name: /sort/i });
        await user.click(sortSelect);

        // Select "Top Rated"
        const topRatedOption = screen.getByRole('option', { name: /Top Rated/i });
        await user.click(topRatedOption);

        // Verify Order (Top Rated First)
        const titles = screen.getAllByRole('heading', { level: 3 });
        expect(titles[0]).toHaveTextContent('Top Rated Prompt');
    });

    it('DISC-03: Sorts by Trending', async () => {
        render(<PromptGallery prompts={TEST_PROMPTS} />);
        const user = userEvent.setup();

        // Open Sort Dropdown
        const sortSelect = screen.getByRole('combobox', { name: /sort/i });
        await user.click(sortSelect);

        // Select "Trending"
        const trendingOption = screen.getByRole('option', { name: /Trending/i });
        await user.click(trendingOption);

        // Verify Order (Trending First)
        const titles = screen.getAllByRole('heading', { level: 3 });
        expect(titles[0]).toHaveTextContent('Trending Prompt');
    });

    it('DISC-04: Sorts by Newest', async () => {
        render(<PromptGallery prompts={TEST_PROMPTS} />);
        const user = userEvent.setup();

        // Open Sort Dropdown
        const sortSelect = screen.getByRole('combobox', { name: /sort/i });
        await user.click(sortSelect);

        // Select "Newest"
        const newestOption = screen.getByRole('option', { name: /Newest/i });
        await user.click(newestOption);

        // Verify Order (Newest First)
        const titles = screen.getAllByRole('heading', { level: 3 });
        expect(titles[0]).toHaveTextContent('Newest Prompt');
    });

    it('DISC-05: Filters by Category', async () => {
        render(<PromptGallery prompts={TEST_PROMPTS} />);
        const user = userEvent.setup();

        // Open Category Dropdown
        const catSelect = screen.getByRole('combobox', { name: /Category/i });
        await user.click(catSelect);

        // Select "Category B"
        const catBOption = screen.getByRole('option', { name: 'Category B' });
        await user.click(catBOption);

        // Verify Results
        expect(screen.queryByText('Top Rated Prompt')).not.toBeInTheDocument(); // Cat A
        expect(screen.getByText('Trending Prompt')).toBeInTheDocument(); // Cat B
    });

    it('DISC-08: Filters by Search', async () => {
        render(<PromptGallery prompts={TEST_PROMPTS} />);
        const user = userEvent.setup();

        const searchInput = screen.getByPlaceholderText(/Search prompts/i);
        await user.type(searchInput, 'Top Rated');

        expect(screen.getByText('Top Rated Prompt')).toBeInTheDocument();
        expect(screen.queryByText('Trending Prompt')).not.toBeInTheDocument();
    });

    it('DISC-06: Check Copy Button', async () => {
        const user = userEvent.setup();
        const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');

        render(<PromptGallery prompts={TEST_PROMPTS.slice(0, 1)} />);

        const copyBtn = screen.getByRole('button', { name: /Copy Prompt/i });
        await user.click(copyBtn);

        expect(writeTextSpy).toHaveBeenCalledWith('Content 1');
        expect(await screen.findByText('Copied')).toBeInTheDocument();
    });
});
