import { readFile } from 'node:fs/promises';
import { basename, extname, isAbsolute } from 'node:path';
import { CallToolResult } from '@modelcontextprotocol/server';
import { chatworkClient, ChatworkClientResponse } from './chatworkClient';
import {
  acceptIncomingRequestParamsSchema,
  createRoomLinkParamsSchema,
  createRoomParamsSchema,
  createRoomTaskParamsSchema,
  deleteOrLeaveRoomParamsSchema,
  deleteRoomLinkParamsSchema,
  deleteRoomMessageParamsSchema,
  getRoomFileParamsSchema,
  getRoomLinkParamsSchema,
  getRoomMessageParamsSchema,
  getRoomParamsSchema,
  getRoomTaskParamsSchema,
  listMyTasksParamsSchema,
  listRoomFilesParamsSchema,
  listRoomMembersParamsSchema,
  listRoomMessagesParamsSchema,
  listRoomTasksParamsSchema,
  postRoomMessageParamsSchema,
  readRoomMessagesParamsSchema,
  rejectIncomingRequestParamsSchema,
  unreadRoomMessageParamsSchema,
  updateRoomLinkParamsSchema,
  updateRoomMembersParamsSchema,
  updateRoomMessageParamsSchema,
  updateRoomParamsSchema,
  updateRoomTasksStatusParamsSchema,
  uploadRoomFileParamsSchema,
} from './schema';
import { z } from 'zod';

function chatworkClientResponseToCallToolResult(
  res: ChatworkClientResponse,
): CallToolResult {
  if (!res.ok) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error: status code ${res.status}`,
        },
        {
          type: 'resource',
          resource: {
            uri: res.uri,
            text: res.response,
          },
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: res.response,
      },
      {
        type: 'resource',
        resource: {
          uri: res.uri,
          text: 'Chatwork',
        },
      },
    ],
  };
}

export const getMe = () =>
  chatworkClient()
    .request({
      path: '/me',
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const getMyStatus = () =>
  chatworkClient()
    .request({
      path: '/my/status',
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const listMyTasks = (req: z.infer<typeof listMyTasksParamsSchema>) =>
  chatworkClient()
    .request({
      path: '/my/tasks',
      method: 'GET',
      query: req.query,
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const listContacts = () =>
  chatworkClient()
    .request({
      path: '/contacts',
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

// TODO: 2500文字という閾値は直感によるもの。適切な値を調査する必要がある。
/** レスポンス文字列が2500文字を超える場合プロパティを絞って返す */
const minifyListRoomsResponse = (
  res: ChatworkClientResponse,
): ChatworkClientResponse => {
  if (!res.ok || res.response.length < 2500) {
    return res;
  }

  const fullResponse: {
    room_id: number;
    name: string;
    type: string;
  }[] = JSON.parse(res.response);
  const minifiedResponse = fullResponse.map(({ room_id, name, type }) => ({
    room_id,
    name,
    type,
  }));
  return {
    ...res,
    response: JSON.stringify(minifiedResponse),
  };
};

export const listRooms = () =>
  chatworkClient()
    .request({
      path: '/rooms',
      method: 'GET',
      query: {},
      body: {},
    })
    .then(minifyListRoomsResponse)
    .then(chatworkClientResponseToCallToolResult);

export const createRoom = (req: z.infer<typeof createRoomParamsSchema>) =>
  chatworkClient()
    .request({
      path: '/rooms',
      method: 'POST',
      body: req.body,
      query: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const getRoom = (req: z.infer<typeof getRoomParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const updateRoom = (req: z.infer<typeof updateRoomParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const deleteOrLeaveRoom = (
  req: z.infer<typeof deleteOrLeaveRoomParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}`,
      method: 'DELETE',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const listRoomMembers = (
  req: z.infer<typeof listRoomMembersParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/members`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const updateRoomMembers = (
  req: z.infer<typeof updateRoomMembersParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/members`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const listRoomMessages = (
  req: z.infer<typeof listRoomMessagesParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages`,
      method: 'GET',
      query: req.query,
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const postRoomMessage = (
  req: z.infer<typeof postRoomMessageParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages`,
      method: 'POST',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const readRoomMessage = (
  req: z.infer<typeof readRoomMessagesParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages/read`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const unreadRoomMessage = (
  req: z.infer<typeof unreadRoomMessageParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages/unread`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const getRoomMessage = (
  req: z.infer<typeof getRoomMessageParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages/${req.path.message_id}`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const updateRoomMessage = (
  req: z.infer<typeof updateRoomMessageParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages/${req.path.message_id}`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const deleteRoomMessage = (
  req: z.infer<typeof deleteRoomMessageParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages/${req.path.message_id}`,
      method: 'DELETE',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const listRoomTasks = (req: z.infer<typeof listRoomTasksParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/tasks`,
      method: 'GET',
      query: req.query,
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const createRoomTask = (
  req: z.infer<typeof createRoomTaskParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/tasks`,
      method: 'POST',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const getRoomTask = (req: z.infer<typeof getRoomTaskParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/tasks/${req.path.task_id}`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const updateRoomTaskStatus = (
  req: z.infer<typeof updateRoomTasksStatusParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/tasks/${req.path.task_id}/status`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const listRoomFiles = (req: z.infer<typeof listRoomFilesParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/files`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

/** Chatwork API のファイルアップロード上限（5MB） */
export const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;

/** 拡張子から Content-Type を決める。知らない拡張子は octet-stream で送る */
const MIME_TYPES: Record<string, string> = {
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
};

const errorResult = (text: string): CallToolResult => ({
  isError: true,
  content: [{ type: 'text', text: `Error: ${text}` }],
});

export interface UploadRoomFileOptions {
  /**
   * `file_path` でサーバー側のファイルを読むことを許すか。
   *
   * stdio では MCP サーバーは利用者自身のマシンで動くので許してよいが、Streamable HTTP では
   * 任意の呼び出し元にサーバー上のファイルを読ませることになるため許してはいけない。
   */
  allowLocalFileRead: boolean;
}

export const uploadRoomFile = async (
  req: z.infer<typeof uploadRoomFileParamsSchema>,
  { allowLocalFileRead }: UploadRoomFileOptions = { allowLocalFileRead: false },
): Promise<CallToolResult> => {
  const { file_path, content_base64, message } = req.body;

  if ((file_path === undefined) === (content_base64 === undefined)) {
    return errorResult(
      'file_path と content_base64 のどちらか一方だけを指定してください',
    );
  }

  let content: Buffer;
  let fileName: string;
  if (file_path !== undefined) {
    if (!allowLocalFileRead) {
      return errorResult(
        'このサーバーでは file_path は使えません。content_base64 と file_name を指定してください',
      );
    }
    if (!isAbsolute(file_path)) {
      return errorResult(
        `file_path は絶対パスで指定してください: ${file_path}`,
      );
    }
    try {
      content = await readFile(file_path);
    } catch (error) {
      return errorResult(
        `ファイルを読み込めませんでした: ${file_path} (${error instanceof Error ? error.message : String(error)})`,
      );
    }
    fileName = req.body.file_name ?? basename(file_path);
  } else {
    if (req.body.file_name === undefined) {
      return errorResult('content_base64 を使うときは file_name が必須です');
    }
    content = Buffer.from(content_base64 ?? '', 'base64');
    fileName = req.body.file_name;
  }

  if (content.length === 0) {
    return errorResult('ファイルが空です');
  }
  if (content.length > MAX_UPLOAD_FILE_SIZE) {
    return errorResult(
      `ファイルサイズが上限の5MBを超えています（${content.length} バイト）`,
    );
  }

  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(content)], {
      type:
        MIME_TYPES[extname(fileName).toLowerCase()] ??
        'application/octet-stream',
    }),
    fileName,
  );
  if (message !== undefined) {
    form.append('message', message);
  }

  return chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/files`,
      method: 'POST',
      query: {},
      body: form,
    })
    .then(chatworkClientResponseToCallToolResult);
};

export const getRoomFile = (req: z.infer<typeof getRoomFileParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/files/${req.path.file_id}`,
      method: 'GET',
      query: req.query,
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const getRoomLink = (req: z.infer<typeof getRoomLinkParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/link`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const createRoomLink = (
  req: z.infer<typeof createRoomLinkParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/link`,
      method: 'POST',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const updateRoomLink = (
  req: z.infer<typeof updateRoomLinkParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/link`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const deleteRoomLink = (
  req: z.infer<typeof deleteRoomLinkParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/link`,
      method: 'DELETE',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const listIncomingRequests = () =>
  chatworkClient()
    .request({
      path: '/incoming_requests',
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const acceptIncomingRequest = (
  req: z.infer<typeof acceptIncomingRequestParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/incoming_requests/${req.path.request_id}/accept`,
      method: 'PUT',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const rejectIncomingRequest = (
  req: z.infer<typeof rejectIncomingRequestParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/incoming_requests/${req.path.request_id}/reject`,
      method: 'DELETE',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);
