import {
  consumeUsage,
  countUserResource,
  getEntitlements,
} from '../services/entitlements.js';

function deny(res, code, message, details = {}) {
  return res.status(403).json({
    success: false,
    error: message,
    code,
    ...details,
  });
}

export function requireFeature(feature) {
  return async (req, res, next) => {
    try {
      const entitlementUserId = req.user.authUserId || req.user.userId;
      const entitlements = await getEntitlements(entitlementUserId);
      if (!entitlements.features[feature]) {
        return deny(res, 'FEATURE_NOT_INCLUDED', `${feature} is not included in your plan`, {
          feature,
          plan: entitlements.plan,
        });
      }
      req.entitlements = entitlements;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function reserveUsage(metric, { amount = 1, cadence = 'month' } = {}) {
  return async (req, res, next) => {
    try {
      const entitlementUserId = req.user.authUserId || req.user.userId;
      const result = await consumeUsage(entitlementUserId, metric, amount, cadence);
      if (!result.allowed) {
        return deny(res, 'PLAN_LIMIT_REACHED', `Your ${metric} limit has been reached`, {
          metric,
          used: result.used,
          limit: result.limit_value,
          plan: result.entitlements.plan,
        });
      }
      req.entitlements = result.entitlements;
      req.usageReservation = { metric, amount, used: result.used };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireResourceCapacity(metric, table, filters = {}) {
  return async (req, res, next) => {
    try {
      const [entitlements, used] = await Promise.all([
        getEntitlements(req.user.authUserId || req.user.userId),
        countUserResource(req.user.userId, table, filters),
      ]);
      const limit = entitlements.limits[metric];
      if (!Number.isFinite(limit) || used >= limit) {
        return deny(res, 'PLAN_LIMIT_REACHED', `Your ${metric} limit has been reached`, {
          metric,
          used,
          limit,
          plan: entitlements.plan,
        });
      }
      req.entitlements = entitlements;
      next();
    } catch (error) {
      next(error);
    }
  };
}
