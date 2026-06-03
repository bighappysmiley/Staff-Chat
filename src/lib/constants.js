// The one server every new account is dropped into automatically. BigHappySmiley
// staff post product updates here.
export const OFFICIAL_SERVER_ID = 'official-updates';
export const OFFICIAL_SERVER_NAME = 'Official Updates';

// Per-server roles, in descending order of power.
export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MODERATOR]: 'Moderator',
  [ROLES.MEMBER]: 'Member',
};

export const ROLE_ORDER = [ROLES.ADMIN, ROLES.MODERATOR, ROLES.MEMBER];

export function canManageServer(role) {
  return role === ROLES.ADMIN;
}

export function canModerate(role) {
  return role === ROLES.ADMIN || role === ROLES.MODERATOR;
}

// Announcement-only channels are read-only for regular members; only admins and
// moderators can post.
export function canPostInChannel(role, channel) {
  if (channel?.announcementOnly) return canModerate(role);
  return true;
}
