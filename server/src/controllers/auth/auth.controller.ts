import { validationResult } from 'express-validator';
import { userService } from '../../services/user.service';
import { verifyGoogleToken } from '../../services/google-auth.service';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import catchAsync from '../../middleware/catch-async';
import { Request, Response } from 'express';
import { userNotFound, emailNotVerified } from '../../responses';
import env from '../../config/env.config';

class AuthController {
  public login = catchAsync(async (req: Request, res: Response) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(400).json(err);
    }

    const { email, password } = req.body;

    const user = await userService.findUserByEmail(email);
    if (!user) return res.status(401).json({ errors: userNotFound });

    const validPassword = await userService.checkPassword(user, password);
    if (!validPassword) return res.status(401).json({ errors: userNotFound });

    if (!user.isVerified)
      return res.status(403).json({ errors: emailNotVerified });

    const authResponse = await userService.generateAuthResponse(user);
    return res.status(200).json(authResponse);
  });

  // Google Sign-In: verify the GIS ID token, find-or-create the user, and
  // issue the same access/refresh token pair as a password login.
  public googleLogin = catchAsync(async (req: Request, res: Response) => {
    const { credential } = req.body as { credential?: string };
    if (!credential || typeof credential !== 'string') {
      return res
        .status(400)
        .json({ errors: [{ msg: 'Missing Google credential.' }] });
    }

    try {
      const googleUser = await verifyGoogleToken(credential);
      const user = await userService.findOrCreateGoogleUser(googleUser.email);
      const authResponse = await userService.generateAuthResponse(user);
      return res.status(200).json(authResponse);
    } catch (error) {
      const status = (error as { status?: number }).status ?? 401;
      const msg =
        (error as Error).message || 'Google sign-in failed — try again.';
      return res.status(status).json({ errors: [{ msg }] });
    }
  });

  public refreshToken = catchAsync(async (req: Request, res: Response) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(400).json(err);
    }

    const refreshToken = req.body.token;

    // make sure this token is still active
    const isTokenActive = await userService.getIsTokenActive(refreshToken);
    if (!isTokenActive) return res.sendStatus(403);

    // verify the token
    jwt.verify(
      refreshToken,
      env.REFRESH_TOKEN_SECRET,
      async (error: VerifyErrors | null, decoded: unknown) => {
        if (error) return res.sendStatus(403);
        try {
          const { id, email, roles } = decoded as RequestUser;
          const user = { id, email, roles };

          // issue new tokens, rotating out only the token that was presented
          const authResponse = await userService.generateAuthResponse(
            user,
            refreshToken
          );
          return res.status(200).json(authResponse);
        } catch (error) {
          console.log(error);
          res.sendStatus(403);
        }
      }
    );
  });

  public logout = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const userId = parseInt(req.user.id);
    await userService.logoutUser(userId);

    return res.sendStatus(200);
  });
}
const authController = new AuthController();

export { authController };
