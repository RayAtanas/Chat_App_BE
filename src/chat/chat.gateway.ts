
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import { MessageService } from '../message/message.service';
import { UserStatus } from '../users/user.entity';

interface JwtPayload {
  sub: string;
  username: string;
}

interface SendMessageData {
  receiverId: string;
  content: string;
}

interface TypingData {
  receiverId: string;
  isTyping: boolean;
}

@WebSocketGateway({
  port: 8080,
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  // Store user socket mappings for direct messaging
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly messageService: MessageService,
  ) {}

  // handle user connection
  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    let payload: JwtPayload;
    
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      return client.disconnect();
    }

    // Store user data in socket
    client.data.user = { id: payload.sub, username: payload.username };
    
    // Map userId to socketId for direct messaging
    this.userSockets.set(payload.sub, client.id);

    // Update user status to online
    await this.usersService.updateStatus(payload.sub, UserStatus.ONLINE);

    // Broadcast user came online to all clients
    this.server.emit('user:status', {
      userId: payload.sub,
      username: payload.username,
      status: UserStatus.ONLINE,
    });

    console.log(`User ${payload.username} connected`);
  }

  //called when client disconnect
  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;

    // Remove from socket mapping
    this.userSockets.delete(user.id);

    //update status
    await this.usersService.updateStatus(user.id, UserStatus.OFFLINE);

    // Broadcast to all clients that user went offline
    this.server.emit('user:status', {
      userId: user.id,
      username: user.username,
      status: UserStatus.OFFLINE,
    });

    console.log(`User ${user.username} disconnected`);
  }

 // handle user logout
  @SubscribeMessage('logout')
  async handleLogout(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user) return;

    await this.usersService.updateStatus(user.id, UserStatus.OFFLINE);
    this.server.emit('user:status', {
      userId: user.id,
      username: user.username,
      status: UserStatus.OFFLINE,
    });

    client.disconnect();
  }

 // handle sending messages
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageData,
  ) {
    const sender = client.data.user;
    if (!sender) return;

    try {
      // Validate receiver exists
      const receiver = await this.usersService.findById(data.receiverId);
      if (!receiver) {
        client.emit('error', { message: 'Receiver not found' });
        return;
      }

      // Save message to database
      const message = await this.messageService.createMessage({
        content: data.content,
        senderId: sender.id,
        receiverId: data.receiverId,
      });

      // Prepare message data for broadcast
      const messageData = {
        id: message.id,
        content: message.content,
        senderId: sender.id,
        senderUsername: sender.username,
        receiverId: data.receiverId,
        receiverUsername: receiver.username,
        createdAt: message.createdAt,
      };

      // Send to receiver if they're online
      const receiverSocketId = this.userSockets.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('message:receive', messageData);
      }

      // Send confirmation back to sender
      client.emit('message:sent', messageData);

      console.log(`Message sent from ${sender.username} to ${receiver.username}`);
    } catch (error) {
      console.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  // handles typing ... when user is chatting
  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingData,
  ) {
    const sender = client.data.user;
    if (!sender) return;

    const receiverSocketId = this.userSockets.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing:start', {
        userId: sender.id,
        username: sender.username,
      });
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingData,
  ) {
    const sender = client.data.user;
    if (!sender) return;

    const receiverSocketId = this.userSockets.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('typing:stop', {
        userId: sender.id,
        username: sender.username,
      });
    }
  }

 // fetches online users
  @SubscribeMessage('users:online')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    try {
      const onlineUsers = await this.usersService.findUsersByStatus(UserStatus.ONLINE);
      client.emit('users:online', onlineUsers);
    } catch (error) {
      console.error('Error fetching online users:', error);
      client.emit('error', { message: 'Failed to fetch online users' });
    }
  }
}