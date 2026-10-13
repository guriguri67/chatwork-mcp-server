import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * リクエストスコープの Chatwork API トークン。
 *
 * stdio では 1 プロセス = 1 利用者なので環境変数で足りるが、Streamable HTTP では
 * 1 プロセスを複数の利用者が共有するため、トークンはリクエストごとに切り替える必要がある。
 * `toolCallbacks.ts` の全コールバックにトークンを引き回す代わりに、ここで文脈として持つ。
 */
export const chatworkApiTokenStorage = new AsyncLocalStorage<string>();

interface ChatworkClientRequest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query: Record<string, string | number | undefined>;
  body: Record<string, string | number | undefined>;
}

interface ChatworkFileUploadRequest {
  path: string;
  fileName: string;
  fileContent: Uint8Array;
  message?: string;
}

export interface ChatworkClientResponse {
  uri: string;
  ok: boolean;
  status: number;
  response: string;
}

export class ChatworkClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async request(req: ChatworkClientRequest): Promise<ChatworkClientResponse> {
    const url = new URL(`https://api.chatwork.com/v2${req.path}`);
    Object.entries(req.query)
      .filter(([, value]) => value !== undefined)
      .forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });

    const body = new URLSearchParams();
    Object.entries(req.body)
      .filter(([, value]) => value !== undefined)
      .forEach(([key, value]) => {
        body.append(key, String(value));
      });

    const fetchInit: RequestInit = {
      method: req.method,
      headers: {
        'X-ChatWorkToken': this.token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    if (body.size > 0) {
      fetchInit.body = body;
    }

    const response = await fetch(url.toString(), fetchInit);
    const rawResponseText = await response.text();

    // Unicodeエスケープを解除する
    let responseText: string;
    try {
      responseText = JSON.stringify(JSON.parse(rawResponseText));
    } catch {
      responseText = rawResponseText;
    }

    return {
      uri: url.toString(),
      ok: response.ok,
      status: response.status,
      response: responseText,
    };
  }

  /**
   * ファイルアップロード系 API は multipart/form-data 専用で、他の API のような
   * application/x-www-form-urlencoded を受け付けないため `request` とは別メソッドにする。
   */
  async uploadFile(
    req: ChatworkFileUploadRequest,
  ): Promise<ChatworkClientResponse> {
    const url = new URL(`https://api.chatwork.com/v2${req.path}`);

    // Buffer は Uint8Array<ArrayBufferLike> であり BlobPart (ArrayBuffer 限定) に
    // 直接は渡せないため、ArrayBuffer 裏付けの Uint8Array にコピーする
    const fileBytes = new Uint8Array(req.fileContent.byteLength);
    fileBytes.set(req.fileContent);

    const formData = new FormData();
    formData.append('file', new Blob([fileBytes]), req.fileName);
    if (req.message !== undefined) {
      formData.append('message', req.message);
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      // Content-Type (boundary 付き multipart/form-data) は fetch が自動設定するため指定しない
      headers: { 'X-ChatWorkToken': this.token },
      body: formData,
    });
    const rawResponseText = await response.text();

    let responseText: string;
    try {
      responseText = JSON.stringify(JSON.parse(rawResponseText));
    } catch {
      responseText = rawResponseText;
    }

    return {
      uri: url.toString(),
      ok: response.ok,
      status: response.status,
      response: responseText,
    };
  }
}

export function chatworkClient() {
  const chatworkApiToken =
    chatworkApiTokenStorage.getStore() ?? process.env['CHATWORK_API_TOKEN'];
  if (!chatworkApiToken) {
    throw new Error('CHATWORK_API_TOKEN is not set');
  }
  return new ChatworkClient(chatworkApiToken);
}
