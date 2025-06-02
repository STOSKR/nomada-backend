/**
 * Unit tests for AuthService
 */

const AuthService = require('../../src/services/auth.service');

describe('AuthService', () => {
    let authService;
    let mockSupabase;

    beforeEach(() => {
        // Mock Supabase client
        mockSupabase = {
            from: jest.fn(() => mockSupabase),
            select: jest.fn(() => mockSupabase),
            eq: jest.fn(() => mockSupabase),
            single: jest.fn(),
            maybeSingle: jest.fn(),
            insert: jest.fn(() => mockSupabase),
            update: jest.fn(() => mockSupabase),
            delete: jest.fn(() => mockSupabase),
            auth: {
                signUp: jest.fn(),
                signInWithPassword: jest.fn(),
                signOut: jest.fn(),
                getUser: jest.fn(),
                updateUser: jest.fn()
            }
        };

        authService = new AuthService(mockSupabase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should throw error if supabase client is not provided', () => {
            expect(() => new AuthService(null)).toThrow('Cliente de Supabase no disponible');
        });

        it('should initialize with supabase client', () => {
            const service = new AuthService(mockSupabase);
            expect(service.supabase).toBe(mockSupabase);
        });
    });

    describe('signup', () => {
        const userData = {
            email: 'test@example.com',
            password: 'password123',
            nomada_id: 'nomada123',
            username: 'testuser',
            bio: 'Test bio'
        };

        it('should sign up user successfully', async () => {
            // Mock email check (not exists)
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null
            });

            // Mock nomada_id check (not exists)
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null
            });

            // Mock auth signup
            mockSupabase.auth.signUp.mockResolvedValue({
                data: {
                    user: { id: 'auth-123', email: 'test@example.com' },
                    session: { access_token: 'token123' }
                },
                error: null
            });

            // Mock user creation in database
            mockSupabase.single.mockResolvedValue({
                data: {
                    id: 'auth-123',
                    ...userData
                },
                error: null
            });

            const result = await authService.signup(userData);

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
                email: userData.email,
                password: userData.password
            });
            expect(result).toBeDefined();
            expect(result.user).toBeDefined();
        });

        it('should throw error if email already exists', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: { id: 'existing-user' },
                error: null
            });

            await expect(authService.signup(userData))
                .rejects.toThrow('El email ya está registrado');
        });

        it('should throw error if nomada_id already exists', async () => {
            // Mock email check (not exists)
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null
            });

            // Mock nomada_id check (exists)
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: { id: 'existing-user' },
                error: null
            });

            await expect(authService.signup(userData))
                .rejects.toThrow('El identificador de nómada ya está en uso');
        });

        it('should throw error if auth signup fails', async () => {
            // Mock email check (not exists)
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null
            });

            // Mock nomada_id check (not exists)
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null
            });

            // Mock auth signup failure
            mockSupabase.auth.signUp.mockResolvedValue({
                data: null,
                error: { message: 'Signup failed' }
            });

            await expect(authService.signup(userData))
                .rejects.toThrow();
        });
    });

    describe('signin', () => {
        const credentials = {
            email: 'test@example.com',
            password: 'password123'
        };

        it('should sign in user successfully', async () => {
            const mockAuthUser = {
                id: 'auth-123',
                email: 'test@example.com'
            };

            const mockDbUser = {
                id: 'auth-123',
                nomada_id: 'nomada123',
                username: 'testuser',
                email: 'test@example.com'
            };

            // Mock auth signin
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: {
                    user: mockAuthUser,
                    session: { access_token: 'token123' }
                },
                error: null
            });

            // Mock database user fetch
            mockSupabase.single.mockResolvedValue({
                data: mockDbUser,
                error: null
            });

            const result = await authService.signin(credentials);

            expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(result).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.session).toBeDefined();
        });

        it('should throw error if signin fails', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: null,
                error: { message: 'Invalid credentials' }
            });

            await expect(authService.signin(credentials))
                .rejects.toThrow();
        });

        it('should throw error if user not found in database', async () => {
            // Mock auth signin success
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: {
                    user: { id: 'auth-123', email: 'test@example.com' },
                    session: { access_token: 'token123' }
                },
                error: null
            });

            // Mock database user not found
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { message: 'User not found' }
            });

            await expect(authService.signin(credentials))
                .rejects.toThrow();
        });
    });

    describe('signout', () => {
        it('should sign out user successfully', async () => {
            mockSupabase.auth.signOut.mockResolvedValue({
                error: null
            });

            await authService.signout();

            expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        });

        it('should throw error if signout fails', async () => {
            mockSupabase.auth.signOut.mockResolvedValue({
                error: { message: 'Signout failed' }
            });

            await expect(authService.signout()).rejects.toThrow();
        });
    });

    describe('getCurrentUser', () => {
        it('should get current user successfully', async () => {
            const mockAuthUser = {
                id: 'auth-123',
                email: 'test@example.com'
            };

            const mockDbUser = {
                id: 'auth-123',
                nomada_id: 'nomada123',
                username: 'testuser',
                email: 'test@example.com'
            };

            // Mock auth get user
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockAuthUser },
                error: null
            });

            // Mock database user fetch
            mockSupabase.single.mockResolvedValue({
                data: mockDbUser,
                error: null
            });

            const result = await authService.getCurrentUser();

            expect(mockSupabase.auth.getUser).toHaveBeenCalled();
            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(result).toBeDefined();
        });

        it('should return null if no authenticated user', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null
            });

            const result = await authService.getCurrentUser();

            expect(result).toBeNull();
        });

        it('should throw error if user not found in database', async () => {
            // Mock auth get user success
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'auth-123' } },
                error: null
            });

            // Mock database user not found
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { message: 'User not found' }
            });

            await expect(authService.getCurrentUser()).rejects.toThrow();
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            mockSupabase.auth.updateUser.mockResolvedValue({
                data: { user: { id: 'auth-123' } },
                error: null
            });

            await authService.changePassword('newPassword123');

            expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
                password: 'newPassword123'
            });
        });

        it('should throw error if password change fails', async () => {
            mockSupabase.auth.updateUser.mockResolvedValue({
                data: null,
                error: { message: 'Password change failed' }
            });

            await expect(authService.changePassword('newPassword123'))
                .rejects.toThrow();
        });
    });

    describe('updateEmail', () => {
        it('should update email successfully', async () => {
            const newEmail = 'newemail@example.com';

            // Mock email availability check
            mockSupabase.maybeSingle.mockResolvedValue({
                data: null,
                error: null
            });

            // Mock auth email update
            mockSupabase.auth.updateUser.mockResolvedValue({
                data: { user: { id: 'auth-123', email: newEmail } },
                error: null
            });

            // Mock database email update
            mockSupabase.single.mockResolvedValue({
                data: { id: 'auth-123', email: newEmail },
                error: null
            });

            const result = await authService.updateEmail('auth-123', newEmail);

            expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
                email: newEmail
            });
            expect(result).toBeDefined();
        });

        it('should throw error if email already exists', async () => {
            mockSupabase.maybeSingle.mockResolvedValue({
                data: { id: 'other-user' },
                error: null
            });

            await expect(authService.updateEmail('auth-123', 'existing@example.com'))
                .rejects.toThrow('El email ya está registrado');
        });
    });

    describe('deleteAccount', () => {
        it('should delete account successfully', async () => {
            // Mock database user deletion
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: null
            });

            await authService.deleteAccount('auth-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'auth-123');
        });

        it('should throw error if deletion fails', async () => {
            mockSupabase.single.mockResolvedValue({
                data: null,
                error: { message: 'Deletion failed' }
            });

            await expect(authService.deleteAccount('auth-123'))
                .rejects.toThrow();
        });
    });
});
