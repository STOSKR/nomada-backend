/**
 * Unit tests for AuthService
 */

const AuthService = require('../../src/services/auth.service');

describe('AuthService', () => {
    let authService;
    let mockSupabase;
    let mockQueryBuilder;

    beforeEach(() => {
        // Mock query builder with fluent interface
        const mockReturnThis = () => mockQueryBuilder;
        
        mockQueryBuilder = {
            from: jest.fn(mockReturnThis),
            select: jest.fn(mockReturnThis),
            insert: jest.fn(mockReturnThis),
            update: jest.fn(mockReturnThis),
            delete: jest.fn(mockReturnThis),
            eq: jest.fn(mockReturnThis),
            neq: jest.fn(mockReturnThis),
            gt: jest.fn(mockReturnThis),
            gte: jest.fn(mockReturnThis),
            lt: jest.fn(mockReturnThis),
            lte: jest.fn(mockReturnThis),
            like: jest.fn(mockReturnThis),
            ilike: jest.fn(mockReturnThis),
            is: jest.fn(mockReturnThis),
            in: jest.fn(mockReturnThis),
            not: jest.fn(mockReturnThis),
            or: jest.fn(mockReturnThis),
            and: jest.fn(mockReturnThis),
            order: jest.fn(mockReturnThis),
            limit: jest.fn(mockReturnThis),
            range: jest.fn(mockReturnThis),
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
        };

        // Mock Supabase client
        mockSupabase = {
            from: jest.fn(() => mockQueryBuilder),
            auth: {
                signUp: jest.fn(),
                signInWithPassword: jest.fn(),
                signOut: jest.fn(),
                getUser: jest.fn(),
                updateUser: jest.fn(),
                resetPasswordForEmail: jest.fn(),
                admin: {
                    deleteUser: jest.fn()
                }
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

        it('should sign up user successfully', async () => {            // Mock email check (not exists)
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null
            });

            // Mock nomada_id check (not exists)
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
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
            mockQueryBuilder.single.mockResolvedValue({
                data: {
                    id: 'auth-123',
                    nomada_id: userData.nomada_id,
                    username: userData.username,
                    email: userData.email
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
        });        it('should throw error if email already exists', async () => {
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
                data: { id: 'existing-user' },
                error: null
            });

            await expect(authService.signup(userData))
                .rejects.toThrow('El email ya está registrado');
        });

        it('should throw error if nomada_id already exists', async () => {            // Mock email check (not exists)
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null
            });

            // Mock nomada_id check (exists)
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
                data: { id: 'existing-user' },
                error: null
            });

            await expect(authService.signup(userData))
                .rejects.toThrow('El identificador de nómada ya está en uso');
        });

        it('should throw error if auth signup fails', async () => {            // Mock email check (not exists)
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null
            });

            // Mock nomada_id check (not exists)
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
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
    });    describe('login', () => {
        const credentials = {
            email: 'test@example.com',
            password: 'password123'
        };

        it('should log in user successfully', async () => {
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
            mockQueryBuilder.single.mockResolvedValue({
                data: mockDbUser,
                error: null
            });

            const result = await authService.login(credentials.email, credentials.password);

            expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(result).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.session).toBeDefined();
        });

        it('should throw error if login fails', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: null,
                error: { message: 'Invalid credentials' }
            });

            await expect(authService.login('test@example.com', 'password123'))
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
            mockQueryBuilder.single.mockResolvedValue({
                data: null,
                error: { message: 'User not found' }
            });

            await expect(authService.login('test@example.com', 'password123'))
                .rejects.toThrow();
        });
    });    describe('logout', () => {
        it('should log out user successfully', async () => {
            mockSupabase.auth.signOut.mockResolvedValue({
                error: null
            });

            const result = await authService.logout();

            expect(mockSupabase.auth.signOut).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('should throw error if logout fails', async () => {
            mockSupabase.auth.signOut.mockResolvedValue({
                error: { message: 'Signout failed' }
            });

            await expect(authService.logout()).rejects.toThrow();
        });
    });    describe('verifyToken', () => {
        it('should verify token successfully', async () => {
            const mockDbUser = {
                id: 'auth-123',
                nomada_id: 'nomada123',
                username: 'testuser',
                email: 'test@example.com',
                bio: 'Test bio'
            };

            // Mock database user fetch
            mockQueryBuilder.single.mockResolvedValue({
                data: mockDbUser,
                error: null
            });

            const result = await authService.verifyToken('auth-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, nomada_id, username, email, bio');
            expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'auth-123');
            expect(result.valid).toBe(true);
            expect(result.user).toEqual(mockDbUser);
        });

        it('should throw error if user not found', async () => {
            mockQueryBuilder.single.mockResolvedValue({
                data: null,
                error: { message: 'User not found' }
            });

            await expect(authService.verifyToken('invalid-user-id'))
                .rejects.toThrow('Token inválido o usuario no encontrado');
        });
    });

    describe('resetPassword', () => {
        it('should send reset password email successfully', async () => {
            mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
                error: null
            });

            const result = await authService.resetPassword('test@example.com');

            expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
                'test@example.com',
                { redirectTo: process.env.PASSWORD_RESET_URL || 'http://localhost:3000/reset-password' }
            );
            expect(result.success).toBe(true);
        });

        it('should throw error if reset password fails', async () => {
            mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
                error: { message: 'Reset failed' }
            });

            await expect(authService.resetPassword('test@example.com'))
                .rejects.toThrow();
        });
    });

    describe('loginWithEmail', () => {
        it('should login with email successfully', async () => {
            const mockData = {
                user: { id: 'auth-123', email: 'test@example.com' },
                session: { access_token: 'token123' }
            };

            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: mockData,
                error: null
            });

            const result = await authService.loginWithEmail('test@example.com', 'password123');

            expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result.success).toBe(true);
            expect(result.session).toEqual(mockData.session);
            expect(result.user).toEqual(mockData.user);
        });

        it('should throw error if loginWithEmail fails', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: null,
                error: { message: 'Login failed' }
            });

            await expect(authService.loginWithEmail('test@example.com', 'wrongpassword'))
                .rejects.toThrow('Login failed');
        });
    });
});
