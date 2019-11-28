import { Repository, EntityRepository } from 'typeorm';
import { User } from './user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const user = await this.hidrateUser(authCredentialsDto);
    try {
      await user.save();
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(`Username ${user.username} already exists`);
      }
    }
  }

  async validateUserPassword(authCredentialsDto:AuthCredentialsDto){
    const {username, password} = authCredentialsDto;
    const user = await this.findOne({ username });
    
    if (user && await user.validatePassword(password)) {
      return user.username;
    }else{
      return null;
    }
  }

  private async hidrateUser(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    let { username, password } = authCredentialsDto;
    const salt = await bcrypt.genSalt();
    password = await bcrypt.hash(password, salt);
    const user = new User(username, password, salt);
    return user;
  }
}
