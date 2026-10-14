import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ChatworkClient } from './chatworkClient';

describe('chatworkClient.ts', () => {
  describe('ChatworkClient#request', () => {
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
      fetchMock.mockResolvedValue(new Response('{"file_id":1}'));
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      fetchMock.mockReset();
      vi.unstubAllGlobals();
    });

    test('通常の body は x-www-form-urlencoded で送る', async () => {
      await new ChatworkClient('token').request({
        path: '/rooms/1/messages',
        method: 'POST',
        query: {},
        body: { body: 'こんにちは', self_unread: undefined },
      });

      const [url, init] = fetchMock.mock.calls[0] ?? [];
      expect(url).toBe('https://api.chatwork.com/v2/rooms/1/messages');
      expect(init?.headers).toEqual({
        'X-ChatWorkToken': 'token',
        'Content-Type': 'application/x-www-form-urlencoded',
      });
      expect(String(init?.body)).toBe(
        new URLSearchParams({ body: 'こんにちは' }).toString(),
      );
    });

    test('FormData の body はそのまま渡し、Content-Type は fetch に任せる', async () => {
      const form = new FormData();
      form.append('file', new Blob(['a,b']), 'a.csv');

      const res = await new ChatworkClient('token').request({
        path: '/rooms/1/files',
        method: 'POST',
        query: {},
        body: form,
      });

      const [, init] = fetchMock.mock.calls[0] ?? [];
      expect(init?.headers).toEqual({ 'X-ChatWorkToken': 'token' });
      expect(init?.body).toBe(form);
      expect(res).toEqual({
        uri: 'https://api.chatwork.com/v2/rooms/1/files',
        ok: true,
        status: 200,
        response: '{"file_id":1}',
      });
    });
  });
});
