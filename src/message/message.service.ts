// src/messages/message.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';

export interface CreateMessageDto {
  content: string;
  senderId: string;
  receiverId: string;
}

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async createMessage(dto: CreateMessageDto): Promise<Message> {
    const message = this.messageRepo.create(dto);
    return this.messageRepo.save(message);
  }

  async getChatHistory(userId1: string, userId2: string): Promise<Message[]> {
    return this.messageRepo.find({
      where: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'receiver'],
    });
  }

  async getRecentChats(userId: string): Promise<any[]> {
    // Get recent conversations for a user
    const recentMessages = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.senderId = :userId OR message.receiverId = :userId', { userId })
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    // Group by conversation partner and get the latest message for each
    const conversations = new Map();
    
    recentMessages.forEach(message => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const partner = message.senderId === userId ? message.receiver : message.sender;
      
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          partnerId,
          partnerUsername: partner.username,
          partnerStatus: partner.status,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          lastMessageSenderId: message.senderId,
        });
      }
    });

    return Array.from(conversations.values());
  }
}