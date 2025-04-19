import { Request, Response } from 'express';
import { AuthService } from '@/application/services/AuthService';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register: (req: Request, res: Response) => Promise<void>;
    login: (req: Request, res: Response) => Promise<void>;
}
