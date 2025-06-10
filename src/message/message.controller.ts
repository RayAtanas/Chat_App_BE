// src/messages/message.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Message } from './message.entity';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('history')
  async getChatHistory(
    @Query('partnerId') partnerId: string,
    @Request() req,
  ): Promise<Message[]> {
    if (!partnerId) {
      throw new BadRequestException('partnerId is required');
    }

    const userId = req.user.userId;
    return this.messageService.getChatHistory(userId, partnerId);
  }

  @Get('conversations')
  async getRecentConversations(@Request() req) {
    const userId = req.user.userId;
    return this.messageService.getRecentChats(userId);
  }
}