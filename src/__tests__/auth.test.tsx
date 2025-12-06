import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Auth from '../pages/Auth';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

// Mock Supabase client
vi.mock('../integrations/supabase/client', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            signInWithOAuth: vi.fn(),
            signUp: vi.fn(),
        },
    },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('AUTH-01: Login with invalid credentials', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays error message on invalid credentials', async () => {
        // Mock failure response
        (supabase.auth.signInWithPassword as any).mockResolvedValue({
            error: { message: 'Invalid login credentials' },
            data: { user: null, session: null },
        });

        render(
            <BrowserRouter>
                <Auth />
            </BrowserRouter>
        );

        // Fill form
        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByRole('button', { name: /Login/i });

        await userEvent.type(emailInput, 'invalid@example.com');
        await userEvent.type(passwordInput, 'wrongpassword');
        await userEvent.click(loginButton);

        // Expect error alert
        await waitFor(() => {
            expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
        });

        // Verify Supabase call
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'invalid@example.com',
            password: 'wrongpassword',
        });
    });
});

describe('AUTH-04 & AUTH-05: OAuth Login', () => {
    it('has Google and GitHub sign-in buttons that trigger OAuth', async () => {
        render(
            <BrowserRouter>
                <Auth />
            </BrowserRouter>
        );

        const googleBtn = screen.getByText(/Google/i);
        const githubBtn = screen.getByText(/GitHub/i);

        expect(googleBtn).toBeInTheDocument();
        expect(githubBtn).toBeInTheDocument();

        // Test Google Click
        await userEvent.click(googleBtn);
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: { redirectTo: expect.any(String) },
        });

        // Test GitHub Click
        await userEvent.click(githubBtn);
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
            provider: 'github',
            options: { redirectTo: expect.any(String) },
        });
    });
});
