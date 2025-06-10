// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '../users/user.module';
import { MessageModule } from 'src/message/message.module';

@Module({
  imports: [
    UsersModule,
    MessageModule,
    
    JwtModule.register({
      secret: process.env.JWT_SECRET || '2831t6e2t30dsadahsdwe2268347rd2372hjdhshcuiw',
    }),
  ],
  providers: [ChatGateway],
})
export class ChatModule {}
