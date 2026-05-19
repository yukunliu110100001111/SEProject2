import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.fn();

vi.mock('../api/request', () => ({
  default: requestMock,
}));

describe('app API client wrappers', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('sends login data to the auth endpoint', async () => {
    const { login } = await import('../api/app');
    const credentials = { username: 'alice', password: 'secret' };

    login(credentials);

    expect(requestMock).toHaveBeenCalledWith({
      url: '/auth/login',
      method: 'post',
      data: credentials,
    });
  });

  it('builds meal detail requests with route params and query params', async () => {
    const { getMealDetail } = await import('../api/app');

    getMealDetail(7, { userId: 3 });

    expect(requestMock).toHaveBeenCalledWith({
      url: '/meals/7',
      method: 'get',
      params: { userId: 3 },
    });
  });

  it('wraps uploaded meal images in FormData', async () => {
    const { uploadMealImage } = await import('../api/app');
    const file = new File(['image-bytes'], 'meal.png', { type: 'image/png' });

    uploadMealImage(9, file);

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/meals/9/image',
        method: 'post',
      })
    );

    const payload = requestMock.mock.calls[0][0].data;
    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get('file')).toBe(file);
  });
});
