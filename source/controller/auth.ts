import { Request, Response } from 'express';
import {
  SignInDto,
  SignUpDto,
  UpdateEmailDto,
  VerifyEmailDto,
} from '../dto/auth';
import { UserRepository } from '../repository/user';
import { WalletRepository } from '../repository/wallet';

import logger from '../utils/winston';
import { AuthError, BadRequestError, NotFoundError } from '../middleware/error';
import { comparePassword, createJWT, hashPassword } from '../utils/auth';
import { UserI } from '../utils/interface';
import { KarmaService } from '../service/karma';
import { Helper } from '../utils/helper';
import { EmailService } from '../service/email';

export default class AuthController {
  static async signUp({ body }: Request, res: Response) {
    const {
      email,
      phone,
      password: unhashedPasswrd,
      firstName,
    } = body as SignUpDto;

    const user = await UserRepository.checkEmailOrPhone({ email, phone }); // check if a user with the email exists
    if (user) throw new BadRequestError('User already exists!');

    const isBlackListed =
      (await KarmaService.userIsBlacklisted(email)) ||
      (await KarmaService.userIsBlacklisted(phone));
    if (isBlackListed) throw new AuthError('User is blacklisted');

    const otp = Helper.generateRandomOtp();
    const password = await hashPassword(unhashedPasswrd);
    const userInfo: UserI = { ...body, password, otp };

    const [userId] = await UserRepository.create(userInfo);
    await AuthController.createWallet(userId);
    EmailService.sendOtp({ to: email, otp, name: firstName });

    res.json({
      message: 'User created successfully! An otp has been sent to the mail',
      success: true,
    });
  }

  static async verifyEmail({ query }: Request, res: Response) {
    const { email, otp } = query as unknown as VerifyEmailDto;

    const user = await UserRepository.findOneBy({ email });
    if (!user) throw new NotFoundError('User not found!');

    const isValidOtp = await Helper.isValidOtp({
      inputOtp: otp,
      generatedOtp: user.otp,
      lastUpdated: user.updatedAt,
    });
    if (!isValidOtp) throw new AuthError('Invalid otp');

    await UserRepository.updateOne({
      where: { email },
      update: { isVerified: true },
    });

    const accessToken = createJWT(user);

    user.isVerified = true; // for the response
    res.json({
      message: 'Email verified!',
      success: true,
      data: Helper.omitSensitiveUserInfo({ ...user, accessToken }),
    });
  }

  static async updateEmail({ body }: Request, res: Response) {
    const { email, userId } = body as UpdateEmailDto;
    const possibleUsers = await UserRepository.checkEmailOrId(body);

    const foundUser = possibleUsers.find((user) => user.userId === userId);
    if (!foundUser) throw new NotFoundError('User not found!');

    /**
     * Make sure the chosen phone number does not already exist.
     * Even if it does, it should be this user that owns it.
     * i.e, they can 'change' their phone number to the same thing
     *
     * PossibleUsers can't be more than 2, at this point but we should cover all cases
     * So instead of possibleUsers.length === 2, we use possibleUsers.length > 1, if perchance more than one user has the email.
     */
    if (possibleUsers.length > 1)
      throw new AuthError('The email is already in use');

    const otp = Helper.generateRandomOtp();
    const where = { email, otp, isVerified: false };

    await UserRepository.updateOne({ where, update: { email } });
    await EmailService.sendOtp({ to: email, otp, name: foundUser.firstName });

    foundUser.email = email; // for the response
    foundUser.otp = otp; // for the response
    res.json({
      message: 'Email updated successfully! An otp has been sent to the mail',
      success: true,
      data: Helper.omitSensitiveUserInfo({ ...foundUser, email }),
    });
  }

  static async createWallet(owner: number) {
    // create wallet logic

    let walletNumber;
    let wallet;

    do {
      walletNumber = Helper.generateWalletAccountNumber();
      wallet = await WalletRepository.getFromAccountNumber(walletNumber);
    } while (wallet);

    WalletRepository.create({ walletNumber, owner });
  }

  static async signIn({ body }: Request, res: Response) {
    const { email, password } = body as SignInDto;

    const user = await UserRepository.findOneBy({ email });
    if (!user) throw new NotFoundError('Invalid email or password.');

    const passwordMatches = await comparePassword(password, user.password);
    if (!passwordMatches) throw new AuthError('Invalid email or password.');

    if (!user.isVerified) throw new AuthError('Email not verified');

    const accessToken = createJWT(user);

    res.json({
      message: 'Sign in successful!',
      success: true,
      data: Helper.omitSensitiveUserInfo({ ...user, accessToken }),
    });
  }
}
