import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    //check new User
    //create User & hash the password
    // ok or error
    try {
      const exists = await this.users.findOne({ email });

      if (exists) {
        //make error
        return { ok: false, error: '이미 존재하는 이메일이 있습니다.' };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      const verification = await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true };
    } catch (error) {
      //make error
      return {
        ok: false,
        error: '알 수 없는 오류로 계정을 생성할 수 없습니다.',
      };
    }
  }

  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    //find the user with the email
    //check if the password is correct
    //make a JWT and give it to the user
    try {
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] },
      );
      if (!user) {
        return {
          ok: false,
          error: '유저를 찾을 수 없습니다.',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: '비밀번호가 틀렸습니다.',
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error: '알 수 없는 오류가 발생했습니다..',
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });
      if (!user) {
        throw Error();
      }
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return { ok: false, error: 'User Not Found' };
    }
  }

  async editProfile(userId: number, { email, password }: EditProfileInput) {
    try {
      const user = await this.users.findOne(userId);
      if (email) {
        user.email = email;
        user.verified = false;
        await this.verifications.delete({ user: { id: user.id } });
        const verification = await this.verifications.save(
          this.verifications.create({ user }),
        );
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: '계정을 업데이트 할 수 없습니다.' };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
      );
      if (verification) {
        verification.user.verified = true;
        this.users.save(verification.user);
        await this.verifications.delete(verification.id);
        return { ok: true };
      }
      return { ok: false, error: 'Verification not found.' };
    } catch (error) {
      return { ok: false, error: 'Could not verify email.' };
    }
  }
}
