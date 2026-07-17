import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getEntitlements: vi.fn(),
  consumeUsage: vi.fn(),
  countUserResource: vi.fn(),
}));

vi.mock('../server/src/services/entitlements.js', () => mocks);

const {
  requireFeature,
  requireResourceCapacity,
  reserveUsage,
} = await import('../server/src/middleware/entitlements.js');

function response() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('entitlement middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows included features and attaches entitlements', async () => {
    const entitlements = {
      plan: { id: 'free' },
      features: { autodm: true },
    };
    mocks.getEntitlements.mockResolvedValue(entitlements);
    const req = { user: { authUserId: 'auth-1', userId: 'local-1' } };
    const res = response();
    const next = vi.fn();

    await requireFeature('autodm')(req, res, next);

    expect(mocks.getEntitlements).toHaveBeenCalledWith('auth-1');
    expect(req.entitlements).toBe(entitlements);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 403 for excluded features', async () => {
    mocks.getEntitlements.mockResolvedValue({
      plan: { id: 'free' },
      features: { api: false },
    });
    const res = response();

    await requireFeature('api')(
      { user: { userId: 'user-1' } },
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FEATURE_NOT_INCLUDED', feature: 'api' }),
    );
  });

  it('reserves usage and exposes the reservation', async () => {
    const entitlements = { plan: { id: 'free' } };
    mocks.consumeUsage.mockResolvedValue({
      allowed: true,
      used: 50,
      limit_value: 50,
      entitlements,
    });
    const req = { user: { userId: 'user-1' } };
    const next = vi.fn();

    await reserveUsage('autodm_replies_per_month')(
      req,
      response(),
      next,
    );

    expect(req.usageReservation).toEqual({
      metric: 'autodm_replies_per_month',
      amount: 1,
      used: 50,
    });
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks usage after the plan limit', async () => {
    mocks.consumeUsage.mockResolvedValue({
      allowed: false,
      used: 50,
      limit_value: 50,
      entitlements: { plan: { id: 'free' } },
    });
    const res = response();

    await reserveUsage('autodm_replies_per_month')(
      { user: { userId: 'user-1' } },
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'PLAN_LIMIT_REACHED',
        used: 50,
        limit: 50,
      }),
    );
  });

  it('checks resource counts and allows the last available slot', async () => {
    mocks.getEntitlements.mockResolvedValue({
      plan: { id: 'free' },
      limits: { autodm_accounts: 3 },
    });
    mocks.countUserResource.mockResolvedValue(2);
    const next = vi.fn();

    await requireResourceCapacity(
      'autodm_accounts',
      'instagram_accounts',
      { is_connected: true },
    )(
      { user: { authUserId: 'auth-1', userId: 'local-1' } },
      response(),
      next,
    );

    expect(mocks.countUserResource).toHaveBeenCalledWith(
      'local-1',
      'instagram_accounts',
      { is_connected: true },
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks resources at the plan limit and forwards service errors', async () => {
    mocks.getEntitlements.mockResolvedValue({
      plan: { id: 'free' },
      limits: { autodm_automations: 1 },
    });
    mocks.countUserResource.mockResolvedValue(1);
    const res = response();
    const next = vi.fn();

    await requireResourceCapacity('autodm_automations', 'automations')(
      { user: { userId: 'user-1' } },
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(403);

    const failure = new Error('database unavailable');
    mocks.getEntitlements.mockRejectedValue(failure);
    await requireFeature('autodm')(
      { user: { userId: 'user-1' } },
      response(),
      next,
    );
    expect(next).toHaveBeenCalledWith(failure);
  });
});
