import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayInit,
  OnGatewayDisconnect,
  WsResponse,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { Logger } from "@nestjs/common";
import { Observable, of } from "rxjs";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { CLIENT_ID_URI } from "../config";
import {
  MessageSendQRResponse,
  MessageSendSignInResponse,
  SiopUriRedirect,
} from "../@types/siop";

@WebSocketGateway({ cookie: false })
export default class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  wss!: Server;

  constructor(@InjectQueue("siop") private readonly siopQueue: Queue) {}

  private logger: Logger = new Logger("EventsGateway");

  afterInit(): void {
    this.logger.log("Initialized!");
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected:     ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected:     ${client.id}`);
  }

  @SubscribeMessage("signIn")
  async handleSignInEvent(
    @MessageBody() uriRedirect: SiopUriRedirect,
    @ConnectedSocket() client: Socket
  ): Promise<Observable<WsResponse<unknown>>> {
    this.logger.debug(`SignIn Received from ${client.id}`);
    if (uriRedirect && uriRedirect.clientUriRedirect) {
      this.logger.debug(`Using URI redirect: ${uriRedirect.clientUriRedirect}`);
    }
    // queueing the requests
    await this.siopQueue.add("userRequest", {
      clientId: CLIENT_ID_URI,
      clientName: uriRedirect.client_name,
      clientScope: uriRedirect.scope,
      sessionId: client.id,
      clientUriRedirect:
        uriRedirect && uriRedirect.clientUriRedirect
          ? uriRedirect.clientUriRedirect
          : undefined,
      isMobile: uriRedirect.isMobile,
    });

    return of({
      event: "signIn",
      data: `SignIn request received and queued for:  ${client.id}`,
    });
  }

  @SubscribeMessage("sendSIOPRequestJwtToFrontend")
  handlePrintQREvent(@MessageBody() qrResponse: MessageSendQRResponse): void {
    this.logger.log(
      `SIOP Request SIOP URI:    ${qrResponse.qRResponse.siopUri}`
    );
    const { clientId } = qrResponse;
    this.wss.to(clientId).emit("printQR", qrResponse.qRResponse);
  }

  @SubscribeMessage("sendSignInResponse")
  handleSignInResponseEvent(
    @MessageBody() message: MessageSendSignInResponse
  ): void {
    this.logger.log(
      `SIOP Response Validation:     ${JSON.stringify(message.siopResponse)}`
    );
    const { clientId } = message;
    this.wss
      .to(clientId)
      .emit("signInResponse", JSON.stringify(message.siopResponse));
  }
}
